
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TeacherService } from 'src/app/services/teacher.service';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-course-contents',
  templateUrl: './course-contents.component.html',
  styleUrls: ['./course-contents.component.css']
})
export class CourseContentsComponent implements OnInit {
  courseId!: number;
  contents: any[] = [];
  groupedContents: any[] = [];
  isLoading: boolean = false;

  isEditMode: boolean = false;
  editContentId: number | null = null;

  selectedFile: File | null = null;

   // NEW
  showSuccessModal = false;
  showErrorModal = false;
  swirlMessage = '';

  // contentData: any = {
  //   title: '',
  //   type: 'video',
  //   url: '',
  //   duration: 0,
  //   position: 1
  // };


 contentData: any = {
    title: '',
    type: 'video',
    url: '',
    position: 1
  };


  constructor(
    private route: ActivatedRoute,
    private teacherService: TeacherService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.courseId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadContents();
  }


  // NEW
  showSwirl(message: string, isError = false) {
    this.swirlMessage = message;
    if (isError) {
      this.showErrorModal = true;
    } else {
      this.showSuccessModal = true;
    }
  }

  // NEW
  closeModal() {
    this.showSuccessModal = false;
  }

  // NEW
  closeErrorModal() {
    this.showErrorModal = false;
  }


  // ================= LOAD =================
  loadContents(): void {
    this.isLoading = true;

    this.teacherService.getCourseContents(this.courseId).subscribe({
      next: (res: any) => {
        this.contents = res?.data || [];
        this.groupedContents = this.groupContents(this.contents);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Get contents error:', err);
        this.isLoading = false;
      }
    });
  }

  // ================= FILE SELECT =================
  onFileSelect(event: any): void {
    const file = event?.target?.files?.[0] || null;
    this.selectedFile = file;
  }

  // ================= VIDEO SAFE URL =================
  getSafeUrl(url: string) {
    if (!url) return '';

    const match =
      url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/) ||
      url.match(/youtube\.com\/embed\/([^&?/]+)/);

    const videoId = match ? match[1] : null;

    if (videoId) {
      return this.sanitizer.bypassSecurityTrustResourceUrl(
        `https://www.youtube.com/embed/${videoId}`
      );
    }

    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  // ================= GROUP CONTENT =================
  groupContents(contents: any[]): any[] {
    const groupedMap = new Map<string, any>();

    for (const item of contents) {
      const key = `${item.position || 0}`;

      if (!groupedMap.has(key)) {
        groupedMap.set(key, {
          id: item.id,
          title: '',
          pdfName: '',
          position: item.position || 1,
          duration: item.duration || 0,
          typeLabel: '',
          videoUrl: null,
          videoId: null,
          pdfId: null
        });
      }

      const existing = groupedMap.get(key);

      // VIDEO
      if (item.type === 'video') {
        existing.videoUrl = item.url;
        existing.videoId = item.id;

        if (!existing.title) {
          existing.title = item.title || '';
        }
      }

      // PDF
      if (item.type === 'pdf') {
        existing.pdfId = item.id;
        existing.pdfName = item.pdf_name || '';
      }

      // TYPE LABEL
      if (existing.videoUrl && existing.pdfName) {
        existing.typeLabel = 'video + pdf';
      } else if (existing.videoUrl) {
        existing.typeLabel = 'video';
      } else if (existing.pdfName) {
        existing.typeLabel = 'pdf';
      }
    }

    return Array.from(groupedMap.values()).sort(
      (a, b) => Number(a.position) - Number(b.position)
    );
  }

  // ================= ADD / UPDATE =================
  submitContent(): void {
    const formData = new FormData();

    const title = (this.contentData.title || '').trim();
    const videoUrl = (this.contentData.url || '').trim();
    // const duration = String(Number(this.contentData.duration) || 0);
    const position = String(Number(this.contentData.position) || 1);

    const hasVideoUrl = !!videoUrl;
    const hasPdfFile = !!this.selectedFile;

    if (!title) {
      // alert('Title is required');
       this.showSwirl('Title is required', true);
      return;
    }

    if (!hasVideoUrl && !hasPdfFile) {
      // alert('Please add video URL or select PDF file');
      this.showSwirl('Please add video URL or select PDF file', true);
      return;
    }

    formData.append('title', title);
    // formData.append('duration', duration);
    formData.append('position', position);

    if (hasVideoUrl) {
      formData.append('url', videoUrl);
    }

    if (hasPdfFile && this.selectedFile) {
      formData.append('pdf', this.selectedFile);
    }

    const existingContent = this.groupedContents.find(
      c => Number(c.position) === Number(position)
    );

    if (existingContent && !this.isEditMode) {
      // alert('This position is already used.');
       this.showSwirl('This position is already used', true);
      return;
    }

    // UPDATE
    if (this.isEditMode && this.editContentId !== null) {
      this.teacherService.updateCourseContent(this.editContentId, formData).subscribe({
        next: () => {
          // alert('Updated successfully');
          this.showSwirl('Updated successfully');
          this.resetForm();
          this.loadContents();
        },
        error: () => 
          // alert('Update failed')
            this.showSwirl('Update failed', true)
      });
      return;
    }

    // ADD
    this.teacherService.addCourseContents(this.courseId, formData).subscribe({
      next: () => {
        // alert('Added successfully');
         this.showSwirl('Added successfully');
        this.resetForm();
        this.loadContents();
      },
      error: () => 
        // alert('Add failed')
      this.showSwirl('Add failed', true)
    });
  }

  // ================= EDIT =================
  editContent(content: any): void {
    this.isEditMode = true;
    this.selectedFile = null;

    if (content.videoId) {
      this.editContentId = content.videoId;
    } else if (content.pdfId) {
      this.editContentId = content.pdfId;
    }

    this.contentData = {
      title: content.title || '',
      url: content.videoUrl || '',
      // duration: content.duration || 0,
      position: content.position || 1
    };
  }

  cancelEdit(): void {
    this.resetForm();
  }
  
  resetForm(): void {
  this.isEditMode = false;
  this.editContentId = null;

  this.contentData = {
    title: '',
    type: 'video',
    url: '',
    // duration: 0,
    position: 1
  };

  this.selectedFile = null;
}
  // ================= DELETE =================
  deleteContent(content: any): void {
  if (!confirm('Delete this content?')) return;

  const idsToDelete: number[] = [];

  if (content.videoId) {
    idsToDelete.push(content.videoId);
  }

  if (content.pdfId) {
    idsToDelete.push(content.pdfId);
  }

  if (idsToDelete.length === 0) {
    // alert('No content found to delete');
      this.showSwirl('No content found to delete', true);
    return;
  }

  let completed = 0;
  let hasError = false;

  idsToDelete.forEach((id) => {
    this.teacherService.deleteCourseContent(id).subscribe({
      next: () => {
        completed++;

        if (completed === idsToDelete.length && !hasError) {
          // alert('Deleted successfully');
          this.showSwirl('Deleted successfully');
          this.loadContents();
        }
      },
      error: (err) => {
        console.error('Delete content error:', err);
        if (!hasError) {
          hasError = true;
          // alert('Delete failed');
            this.showSwirl('Delete failed', true);
        }
      }
    });
  });
}
  // ================= DOWNLOAD PDF =================
  downloadPdfFile(pdfId: number, fileName: string) {
  const token = sessionStorage.getItem('token') || localStorage.getItem('token');

  fetch(`http://localhost:5000/api/teacher/content/pdf/${pdfId}`, {
    headers: {
      Authorization: `Bearer ${token || ''}`
    }
  })
    .then(async (res) => {
      if (!res.ok) {
        throw new Error('Failed to open PDF');
      }

      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(
        new Blob([blob], { type: 'application/pdf' })
      );

      window.open(blobUrl, '_blank');

      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 60000);
    })
    .catch((err) => {
      console.error('Open PDF error:', err);
      // alert('PDF open failed');
      this.showSwirl('PDF open failed', true);
    });
  }

  // video duration
formatDuration(totalSeconds: number): string {
  const seconds = Number(totalSeconds) || 0;

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  const hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  const ss = String(remainingSeconds).padStart(2, '0');

  return `${hh}:${mm}:${ss}`;
}

}


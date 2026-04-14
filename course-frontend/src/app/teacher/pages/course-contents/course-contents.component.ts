// import { Component, OnInit } from '@angular/core';
// import { ActivatedRoute } from '@angular/router';
// import { TeacherService } from 'src/app/services/teacher.service';
// import { DomSanitizer } from '@angular/platform-browser';

// @Component({
//   selector: 'app-course-contents',
//   templateUrl: './course-contents.component.html',
//   styleUrls: ['./course-contents.component.css']
// })
// export class CourseContentsComponent implements OnInit {
//   courseId!: number;
//   contents: any[] = [];
//   groupedContents: any[] = [];
//   isLoading: boolean = false;

//   isEditMode: boolean = false;
//   editContentId: number | null = null;

//   selectedFile: File | null = null;

//   contentData: any = {
//     title: '',
//     type: 'video',
//     url: '',
//     duration: 0,
//     position: 1
//   };

//   constructor(
//     private route: ActivatedRoute,
//     private teacherService: TeacherService,
//     private sanitizer: DomSanitizer
//   ) {}

//   ngOnInit(): void {
//     this.courseId = Number(this.route.snapshot.paramMap.get('id'));
//     this.loadContents();
//   }

//   loadContents(): void {
//     this.isLoading = true;

//     this.teacherService.getCourseContents(this.courseId).subscribe({
//       next: (res: any) => {
//         this.contents = res?.data || [];
//         this.groupedContents = this.groupContents(this.contents);
//         this.isLoading = false;
//       },
//       error: (err) => {
//         console.error('Get contents error:', err);
//         this.isLoading = false;
//       }
//     });
//   }

//   onFileSelect(event: any): void {
//     const file = event?.target?.files?.[0] || null;
//     this.selectedFile = file;
//   }
//   getSafeUrl(url: string) {
//   if (!url) return '';

//   const match =
//     url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/) ||
//     url.match(/youtube\.com\/embed\/([^&?/]+)/);

//   const videoId = match ? match[1] : null;

//   if (videoId) {
//     return this.sanitizer.bypassSecurityTrustResourceUrl(
//       `https://www.youtube.com/embed/${videoId}`
//     );
//   }

//   return this.sanitizer.bypassSecurityTrustResourceUrl(this.getFileUrl(url));
// }

// getFileUrl(url: string): string {
//   if (!url) return '';
//   if (url.startsWith('http://') || url.startsWith('https://')) return url;
//   return `http://localhost:5000${url}`;
// }

//   groupContents(contents: any[]): any[] {
//   const groupedMap = new Map<string, any>();

//   for (const item of contents) {
//     const key = `${item.position || 0}`;

//     if (!groupedMap.has(key)) {
//       groupedMap.set(key, {
//         id: item.id,
//         title: '',
//         pdfName: '',
//         position: item.position || 1,
//         duration: item.duration || 0,
//         typeLabel: '',
//         videoUrl: null,
//         pdfUrl: null,
//         videoId: null,
//         pdfId: null
//       });
//     }

//     const existing = groupedMap.get(key);

//     if (item.type === 'video') {
//       existing.videoUrl = item.url;
//       existing.videoId = item.id;

//       if (!existing.title) {
//         existing.title = item.title || '';
//       }
//     }


//     if (item.type === 'pdf') {
//   existing.pdfUrl = item.url;
//   existing.pdfId = item.id;
//   existing.pdfName = item.original_name || '';
// }

//     if (existing.videoUrl && existing.pdfUrl) {
//       existing.typeLabel = 'video + pdf';
//     } else if (existing.videoUrl) {
//       existing.typeLabel = 'video';
//     } else if (existing.pdfUrl) {
//       existing.typeLabel = 'pdf';
//     }
//   }

//   return Array.from(groupedMap.values()).sort(
//     (a, b) => Number(a.position) - Number(b.position)
//   );
// }
  

//   submitContent(): void {
//     const formData = new FormData();

//     const title = (this.contentData.title || '').trim();
//     const videoUrl = (this.contentData.url || '').trim();
//     const duration = String(Number(this.contentData.duration) || 0);
//     const position = String(Number(this.contentData.position) || 1);

//     const hasVideoUrl = !!videoUrl;
//     const hasPdfFile = !!this.selectedFile;

//     if (!title) {
//       alert('Title is required');
//       return;
//     }

//     if (!hasVideoUrl && !hasPdfFile) {
//       alert('Please add video URL or select PDF file');
//       return;
//     }

//     formData.append('title', title);
//     formData.append('duration', duration);
//     formData.append('position', position);

//     if (hasVideoUrl) {
//       formData.append('url', videoUrl);
//     }

//     if (hasPdfFile && this.selectedFile) {
//       formData.append('pdf', this.selectedFile);
//     }
//     const existingContent = this.groupedContents.find(
//   c => Number(c.position) === Number(position)
// );

// if (existingContent && !this.isEditMode) {
//   alert('This position is already used. Please choose another position.');
//   return;
// }

//     if (this.isEditMode) {
//       if (this.editContentId !== null) {
//         this.teacherService.updateCourseContent(this.editContentId, formData).subscribe({
//           next: () => {
//             alert('Content updated successfully');
//             this.resetForm();
//             this.loadContents();
//           },
//           error: (err) => {
//             console.error('Update content error:', err);
//             alert('Failed to update content');
//           }
//         });
//       }
//       return;
//     }

//     this.teacherService.addCourseContents(this.courseId, formData).subscribe({
//       next: () => {
//         alert('Content added successfully');
//         this.resetForm();
//         this.loadContents();
//       },
//       error: (err) => {
//         console.error('Add content error:', err);
//         alert('Failed to add content');
//       }
//     });
//   }

// editContent(content: any): void {
//   this.isEditMode = true;
//   this.selectedFile = null;

//   // ✅ jis type ka actual content edit karna hai usi id ko pick karo
//   if (content.videoId) {
//     this.editContentId = content.videoId;
//     this.contentData.type = 'video';
//   } else if (content.pdfId) {
//     this.editContentId = content.pdfId;
//     this.contentData.type = 'pdf';
//   } else {
//     this.editContentId = content.id || null;
//     this.contentData.type = content.type || 'video';
//   }

//   this.contentData = {
//     title: content.title || '',
//     type: content.videoId ? 'video' : (content.pdfId ? 'pdf' : (content.type || 'video')),
//     url: content.videoUrl || content.pdfUrl || '',
//     duration: content.duration || 0,
//     position: content.position || 1
//   };
// }




//   cancelEdit(): void {
//     this.resetForm();
//   }

//   deleteContent(contentId: number): void {
//     const confirmDelete = confirm('Are you sure you want to delete this content?');
//     if (!confirmDelete) return;

//     this.teacherService.deleteCourseContent(contentId).subscribe({
//       next: () => {
//         alert('Content deleted successfully');
//         this.loadContents();
//       },
//       error: (err) => {
//         console.error('Delete content error:', err);
//         alert('Failed to delete content');
//       }
//     });
//   }

//   resetForm(): void {
//     this.isEditMode = false;
//     this.editContentId = null;

//     this.contentData = {
//       title: '',
//       type: 'video',
//       url: '',
//       duration: 0,
//       position: 1
//     };

//     this.selectedFile = null;
//   }


// getContentByPosition(position: number) {
//   return this.groupedContents.find(c => Number(c.position) === Number(position));
// }

//   getPdfDisplayName(pdfUrl: string): string {
//   if (!pdfUrl) return 'PDF File';

//   const fileName = pdfUrl.split('/').pop() || '';

//   // starting timestamp-number remove
//   return fileName.replace(/^\d+-/, '');
// }

// }



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

  contentData: any = {
    title: '',
    type: 'video',
    url: '',
    duration: 0,
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

  onFileSelect(event: any): void {
    const file = event?.target?.files?.[0] || null;
    this.selectedFile = file;
  }

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

    return this.sanitizer.bypassSecurityTrustResourceUrl(this.getFileUrl(url));
  }

  getFileUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `http://localhost:5000${url}`;
  }

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
          pdfUrl: null,
          videoId: null,
          pdfId: null
        });
      }

      const existing = groupedMap.get(key);

      if (item.type === 'video') {
        existing.videoUrl = item.url;
        existing.videoId = item.id;

        if (!existing.title) {
          existing.title = item.title || '';
        }
      }

      if (item.type === 'pdf') {
        existing.pdfUrl = item.url;
        existing.pdfId = item.id;
        existing.pdfName = item.pdf_name || item.title || '';
      }

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

  submitContent(): void {
    const formData = new FormData();

    const title = (this.contentData.title || '').trim();
    const videoUrl = (this.contentData.url || '').trim();
    const duration = String(Number(this.contentData.duration) || 0);
    const position = String(Number(this.contentData.position) || 1);

    const hasVideoUrl = !!videoUrl;
    const hasPdfFile = !!this.selectedFile;

    if (!title) {
      alert('Title is required');
      return;
    }

    if (!hasVideoUrl && !hasPdfFile) {
      alert('Please add video URL or select PDF file');
      return;
    }

    formData.append('title', title);
    formData.append('duration', duration);
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
      alert('This position is already used. Please choose another position.');
      return;
    }

    if (this.isEditMode) {
      if (this.editContentId !== null) {
        this.teacherService.updateCourseContent(this.editContentId, formData).subscribe({
          next: () => {
            alert('Content updated successfully');
            this.resetForm();
            this.loadContents();
          },
          error: (err) => {
            console.error('Update content error:', err);
            alert('Failed to update content');
          }
        });
      }
      return;
    }

    this.teacherService.addCourseContents(this.courseId, formData).subscribe({
      next: () => {
        alert('Content added successfully');
        this.resetForm();
        this.loadContents();
      },
      error: (err) => {
        console.error('Add content error:', err);
        alert('Failed to add content');
      }
    });
  }

  editContent(content: any): void {
    this.isEditMode = true;
    this.selectedFile = null;

    if (content.videoId) {
      this.editContentId = content.videoId;
      this.contentData.type = 'video';
    } else if (content.pdfId) {
      this.editContentId = content.pdfId;
      this.contentData.type = 'pdf';
    } else {
      this.editContentId = content.id || null;
      this.contentData.type = content.type || 'video';
    }

    this.contentData = {
      title: content.title || '',
      type: content.videoId ? 'video' : (content.pdfId ? 'pdf' : (content.type || 'video')),
      url: content.videoUrl || '',
      duration: content.duration || 0,
      position: content.position || 1
    };
  }

  cancelEdit(): void {
    this.resetForm();
  }

  deleteContent(contentId: number): void {
    const confirmDelete = confirm('Are you sure you want to delete this content?');
    if (!confirmDelete) return;

    this.teacherService.deleteCourseContent(contentId).subscribe({
      next: () => {
        alert('Content deleted successfully');
        this.loadContents();
      },
      error: (err) => {
        console.error('Delete content error:', err);
        alert('Failed to delete content');
      }
    });
  }

  resetForm(): void {
    this.isEditMode = false;
    this.editContentId = null;

    this.contentData = {
      title: '',
      type: 'video',
      url: '',
      duration: 0,
      position: 1
    };

    this.selectedFile = null;
  }

  getContentByPosition(position: number) {
    return this.groupedContents.find(c => Number(c.position) === Number(position));
  }

  getPdfDisplayName(pdfName: string): string {
    if (!pdfName) return 'PDF File';
    return pdfName;
  }
}

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TeacherService } from 'src/app/services/teacher.service';

@Component({
  selector: 'app-course-contents',
  templateUrl: './course-contents.component.html',
  styleUrls: ['./course-contents.component.css']
})
export class CourseContentsComponent implements OnInit {
  courseId!: number;
  contents: any[] = [];
  isLoading: boolean = false;

  isEditMode: boolean = false;
  editContentId: number | null = null;

  contentData: any = {
    title: '',
    type: 'video',
    url: '',
    duration: 0,
    position: 1
  };

  constructor(
    private route: ActivatedRoute,
    private teacherService: TeacherService
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
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Get contents error:', err);
        this.isLoading = false;
      }
    });
  }

  submitContent(): void {
    if (this.isEditMode && this.editContentId) {
      this.teacherService.updateCourseContent(this.editContentId, {
        title: this.contentData.title,
        type: this.contentData.type,
        url: this.contentData.url,
        duration: Number(this.contentData.duration) || 0,
        position: Number(this.contentData.position) || 1
      }).subscribe({
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
    } else {
      const payload = {
        contents: [
          {
            title: this.contentData.title,
            type: this.contentData.type,
            url: this.contentData.url,
            duration: Number(this.contentData.duration) || 0,
            position: Number(this.contentData.position) || 1
          }
        ]
      };

      this.teacherService.addCourseContents(this.courseId, payload).subscribe({
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
  }

  editContent(content: any): void {
    this.isEditMode = true;
    this.editContentId = content.id;

    this.contentData = {
      title: content.title || '',
      type: content.type || 'video',
      url: content.url || '',
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
  }
}

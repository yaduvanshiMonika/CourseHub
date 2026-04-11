import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TeacherService } from 'src/app/services/teacher.service';

@Component({
  selector: 'app-add-course',
  templateUrl: './add-course.component.html',
  styleUrls: ['./add-course.component.css']
})
export class AddCourseComponent implements OnInit {
  isEditMode: boolean = false;
  editCourseId: number | null = null;

  courseData: any = {
    title: '',
    category: '',
    instructor: '',
    price: '',
    status: 'draft',
    description: '',
    video_link: '',
    pdf_link: '',
    thumbnailUrl: ''
  };

  constructor(
    private teacherService: TeacherService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const navState = history.state;

    if (navState && navState.editCourse) {
      this.isEditMode = true;
      this.editCourseId = navState.editCourse.id;

      this.courseData = {
        title: navState.editCourse.title || '',
        category: navState.editCourse.category || '',
        instructor: navState.editCourse.instructor || '',
        price: navState.editCourse.price || '',
        status: navState.editCourse.status || 'draft',
        description: navState.editCourse.description || '',
        video_link: navState.editCourse.video_link || '',
        pdf_link: navState.editCourse.pdf_link || '',
        thumbnailUrl: navState.editCourse.thumbnail_url || ''
      };
    }
  }

  submitCourse(): void {
    if (this.isEditMode && this.editCourseId) {
      this.teacherService.updateCourse(this.editCourseId, this.courseData).subscribe({
        next: () => {
          alert('Course updated successfully');
          this.router.navigate(['/teacher/my-courses']);
        },
        error: (err) => {
          console.error('Update course error:', err);
          alert('Course update failed');
        }
      });
    } else {
      this.teacherService.addCourse(this.courseData).subscribe({
        next: () => {
          alert('Course added successfully');
          this.router.navigate(['/teacher/my-courses']);
        },
        error: (err) => {
          console.error('Add course error:', err);
          alert('Course add failed');
        }
      });
    }
  }
}
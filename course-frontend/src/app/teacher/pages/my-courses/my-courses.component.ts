import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TeacherService } from 'src/app/services/teacher.service';

@Component({
  selector: 'app-my-courses',
  templateUrl: './my-courses.component.html',
  styleUrls: ['./my-courses.component.css']
})
export class MyCoursesComponent implements OnInit {
  courses: any[] = [];
  isLoading: boolean = false;

  constructor(
    private teacherService: TeacherService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCourses();
  }

  loadCourses(): void {
    this.isLoading = true;

    this.teacherService.getMyCourses().subscribe({
      next: (res: any) => {
        this.courses = res?.data || [];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Get my courses error:', err);
        this.isLoading = false;
      }
    });
  }

  goToContents(courseId: number): void {
    this.router.navigate(['/teacher/contents', courseId]);
  }

  goToEnrollments(courseId: number): void {
    this.router.navigate(['/teacher/enrollments', courseId]);
  }

  editCourse(course: any): void {
    this.router.navigate(['/teacher/add-course'], {
      state: { editCourse: course }
    });
  }

  deleteCourse(courseId: number): void {
    const confirmDelete = confirm('Are you sure you want to delete this course?');

    if (!confirmDelete) return;

    this.teacherService.deleteCourse(courseId).subscribe({
      next: () => {
        alert('Course deleted successfully');
        this.loadCourses();
      },
      error: (err) => {
        console.error('Delete course error:', err);
        alert('Failed to delete course');
      }
    });
  }
}
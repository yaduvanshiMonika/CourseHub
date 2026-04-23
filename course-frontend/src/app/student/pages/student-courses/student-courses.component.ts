import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { StudentService } from 'src/app/services/student.service';

@Component({
  selector: 'app-student-courses',
  templateUrl: './student-courses.component.html',
  styleUrls: ['./student-courses.component.css']
})
export class StudentCoursesComponent implements OnInit {
  loading: boolean = false;
  studentCourses: any[] = [];

  constructor(
    private studentService: StudentService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadStudentCourses();
  }

  loadStudentCourses(): void {
    this.loading = true;

    this.studentService.getStudentCourses().subscribe({
      next: (res) => {
        this.loading = false;

        if (res?.success && Array.isArray(res.data)) {
          this.studentCourses = res.data;
        } else {
          this.studentCourses = [];
        }
      },
      error: (err) => {
        this.loading = false;
        this.studentCourses = [];
        console.error('Student courses error:', err);
      }
    });
  }

  openCourse(courseId: number): void {
    this.router.navigate(['/student/course', courseId, 'learn']);
  }

  getButtonLabel(course: any): string {
    const progress = Number(course?.progress_percent || 0);

    if (progress <= 0) {
      return 'Start';
    }

    if (progress > 0 && progress < 100) {
      return 'Resume';
    }

    return 'Review';
  }
}
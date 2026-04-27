import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TeacherService } from 'src/app/services/teacher.service';

@Component({
  selector: 'app-enrollments',
  templateUrl: './enrollments.component.html',
  styleUrls: ['./enrollments.component.css']
})
export class EnrollmentsComponent implements OnInit {
  courseId = '';
  enrollments: any[] = [];
  errorMessage = '';
  loading = false;

  constructor(
    private route: ActivatedRoute,
    private teacherService: TeacherService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.courseId = this.route.snapshot.paramMap.get('id') || '';
    this.fetchEnrollments();
  }

  backToMyCourses(): void {
    this.router.navigate(['/teacher/my-courses']);
  }

  fetchEnrollments(): void {
    if (!this.courseId) {
      this.errorMessage = 'Missing course id.';
      return;
    }
    this.loading = true;
    this.errorMessage = '';
    this.teacherService.getCourseEnrollments(Number(this.courseId)).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.enrollments = res?.data || [];
      },
      error: (err) => {
        this.loading = false;
        console.error(err);
        this.errorMessage =
          err?.error?.message || 'Could not load enrollments for this course.';
      }
    });
  }
}
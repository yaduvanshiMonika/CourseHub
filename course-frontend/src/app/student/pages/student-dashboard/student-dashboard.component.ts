import { Component, OnInit } from '@angular/core';
import { StudentService } from 'src/app/services/student.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-student-dashboard',
  templateUrl: './student-dashboard.component.html',
  styleUrls: ['./student-dashboard.component.css']
})
export class StudentDashboardComponent implements OnInit {
  studentName: string = 'Student';
  loading: boolean = false;

  stats = {
    enrolledCourses: 0,
    completedCourses: 0,
    inProgressCourses: 0
  };

  recentCourses: any[] = [];

  constructor(private studentService: StudentService) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

loadDashboardData(): void {
  this.loading = true;

  this.studentService.getStudentProfile().subscribe({
    next: (res) => {
      if (res?.success && res?.data) {
        this.studentName = res.data.name || 'Student';
        this.stats.enrolledCourses = res.data.enrolledCourses || 0;
      }
    },
    error: (err) => {
      console.error('Profile load error:', err);
    }
  });

  this.studentService.getStudentCourses().subscribe({
    next: (res) => {
      this.loading = false;

      if (res?.success && Array.isArray(res.data)) {
        const courses = res.data || [];

        this.recentCourses = courses.slice(0, 4);

        this.stats.completedCourses = courses.filter(
          (course: any) => Number(course.progress_percent) >= 100
        ).length;

        this.stats.inProgressCourses = courses.filter(
          (course: any) =>
            Number(course.progress_percent) > 0 &&
            Number(course.progress_percent) < 100
        ).length;
      } else {
        this.recentCourses = [];
      }
    },
    error: (err) => {
      this.loading = false;
      this.recentCourses = [];
      console.error('Student courses load error:', err);
    }
  });
}
}



import { Component, OnInit } from '@angular/core';
import { StudentService } from 'src/app/services/student.service';

export type DashboardCourseTab = 'in_progress' | 'completed';

@Component({
  selector: 'app-student-dashboard',
  templateUrl: './student-dashboard.component.html',
  styleUrls: ['./student-dashboard.component.css']
})
export class StudentDashboardComponent implements OnInit {
  studentName = 'Student';
  loading = false;

  stats = {
    enrolledCourses: 0,
    completedCourses: 0,
    inProgressCourses: 0
  };

  /** All enrolled courses (progress from completed videos / total videos). */
  allCourses: any[] = [];
  courseTab: DashboardCourseTab = 'in_progress';

  constructor(private studentService: StudentService) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  get filteredCourses(): any[] {
    const list = this.allCourses || [];
    if (this.courseTab === 'completed') {
      return list.filter((c) => Number(c.progress_percent || 0) >= 100);
    }
    return list.filter((c) => Number(c.progress_percent || 0) < 100);
  }

  loadDashboardData(): void {
    this.loading = true;

    this.studentService.getStudentProfile().subscribe({
      next: (res) => {
        if (res?.success && res?.data) {
          this.studentName = res.data.name || 'Student';
        }
      },
      error: (err) => console.error('Profile load error:', err)
    });

    this.studentService.getStudentCourses().subscribe({
      next: (res) => {
        this.loading = false;

        if (res?.success && Array.isArray(res.data)) {
          const courses = res.data || [];
          this.allCourses = courses;
          this.stats.enrolledCourses = courses.length;

          this.stats.completedCourses = courses.filter(
            (c: any) => Number(c.progress_percent || 0) >= 100
          ).length;

          this.stats.inProgressCourses = courses.filter(
            (c: any) =>
              Number(c.progress_percent || 0) > 0 &&
              Number(c.progress_percent || 0) < 100
          ).length;
        } else {
          this.allCourses = [];
          this.stats.enrolledCourses = 0;
          this.stats.completedCourses = 0;
          this.stats.inProgressCourses = 0;
        }
      },
      error: (err) => {
        this.loading = false;
        this.allCourses = [];
        console.error('Student courses load error:', err);
      }
    });
  }
}

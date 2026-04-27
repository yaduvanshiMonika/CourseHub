import { Component, HostListener, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { StudentService } from 'src/app/services/student.service';

@Component({
  selector: 'app-student-layout',
  templateUrl: './student-layout.component.html',
  styleUrls: ['./student-layout.component.css']
})
export class StudentLayoutComponent implements OnInit {
  menuOpen = false;
  studentName: string = 'Student';
  studentInitial: string = 'S';
  /** Active paid enrollments (same list as My Courses). */
  enrolledCourseCount: number | null = null;

  constructor(
    private router: Router,
    private studentService: StudentService
  ) {}

  ngOnInit(): void {
    this.studentName = sessionStorage.getItem('name') || 'Student';
    this.studentInitial = this.studentName.charAt(0).toUpperCase();
    this.loadEnrollmentCount();
  }

  private loadEnrollmentCount(): void {
    const token =
      sessionStorage.getItem('token') || localStorage.getItem('token');
    if (!token) {
      this.enrolledCourseCount = null;
      return;
    }
    this.studentService.getStudentCourses().subscribe({
      next: (res) => {
        if (res?.success && Array.isArray(res.data)) {
          this.enrolledCourseCount = res.data.length;
        } else {
          this.enrolledCourseCount = 0;
        }
      },
      error: () => {
        this.enrolledCourseCount = null;
      }
    });
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  @HostListener('document:click')
  closeMenu(): void {
    this.menuOpen = false;
  }

  goToSite(): void {
    this.menuOpen = false;
    this.router.navigate(['/']);
  }

  logout(): void {
    this.menuOpen = false;
    sessionStorage.clear();
    this.router.navigate(['/login']);
  }
}
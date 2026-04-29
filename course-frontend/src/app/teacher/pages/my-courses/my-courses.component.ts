import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TeacherService } from 'src/app/services/teacher.service';
import { NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-my-courses',
  templateUrl: './my-courses.component.html',
  styleUrls: ['./my-courses.component.css']
})
export class MyCoursesComponent implements OnInit {
  courses: any[] = [];
  isLoading: boolean = false;

  // NEW
  showSuccessModal = false;
  showErrorModal = false;
  swirlMessage = '';

  constructor(
    private teacherService: TeacherService,
    private router: Router,
    private auth: AuthService
  ) {}

  
  ngOnInit(): void {
  this.loadCourses();

  this.router.events
    .pipe(filter(event => event instanceof NavigationEnd))
    .subscribe(() => {
      this.loadCourses();   // 🔥 auto refresh when coming back
    });
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



   loadCourses(): void {
    this.isLoading = true;

    this.teacherService.getMyCourses().subscribe({
      next: (res: any) => {
        console.log('GET MY COURSES RESPONSE =', res);

        if (res && res.success) {
          this.courses = res.data || [];
        } else {
          this.courses = [];
        }

            this.isLoading = false;
      },
      error: (err) => {
        console.error('Get my courses error:', err);
        this.courses = [];
        this.isLoading = false;

        // If token is missing/invalid or user is not a teacher, redirect safely.
        if (err?.status === 401 || err?.status === 403) {
          const role = this.auth.getRole();
          if (role === 'admin') this.router.navigate(['/admin-dashboard']);
          else if (role === 'student') this.router.navigate(['/student/student-dashboard']);
          else this.router.navigate(['/login']);
        }
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

  
//   deleteCourse(courseId: number) {
//   this.teacherService.deleteCourse(courseId).subscribe(() => {
//     // alert('Deleted');
//      this.showSwirl('Course deleted successfully');
//     this.loadCourses();   //  auto refresh
    
//   });
// }
  
// }

deleteCourse(courseId: number) {
    this.teacherService.deleteCourse(courseId).subscribe({
      next: () => {
        this.showSwirl('Course deleted successfully');
        this.loadCourses();
      },
      error: (err) => {
        console.error('Delete course error:', err);
        this.showSwirl('Course delete failed', true);
      }
    });
  }

} 
import { Component, NgZone, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CourseService } from 'src/app/services/course.service';

declare var Razorpay: any;

@Component({
  selector: 'app-course-detail',
  templateUrl: './course-detail.component.html',
  styleUrls: ['./course-detail.component.css']
})
export class CourseDetailComponent implements OnInit {

  course: any = null;
  loadError = false;
  /** Active paid enrollment — full videos/PDFs only in student learning area */
  hasFullAccess = false;

  role = sessionStorage.getItem('role');
  isLoggedIn = !!sessionStorage.getItem('token');

  constructor(
    private route: ActivatedRoute,
    private courseService: CourseService,
    private router: Router,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isFinite(id) || id < 1) {
      this.loadError = true;
      return;
    }
    this.courseService.getCourseById(id).subscribe({
      next: (c: any) => {
        this.course = c;
        this.loadError = false;
        this.tryCheckAccess(id);
      },
      error: () => {
        this.loadError = true;
      }
    });
  }

  get curriculum(): any[] {
    return Array.isArray(this.course?.curriculum_outline) ? this.course.curriculum_outline : [];
  }

  get lessonCount(): number {
    return this.curriculum.length;
  }

  formatDuration(totalSeconds: number): string {
    const seconds = Number(totalSeconds) || 0;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    const hh = String(hours).padStart(2, '0');
    const mm = String(minutes).padStart(2, '0');
    const ss = String(remainingSeconds).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  }

  private tryCheckAccess(courseId: number): void {
    const token = sessionStorage.getItem('token');
    if (!token || this.role !== 'student') {
      return;
    }
    this.courseService.checkAccess(courseId).subscribe({
      next: (res: any) => {
        this.hasFullAccess = !!res?.hasAccess;
      },
      error: () => {
        this.hasFullAccess = false;
      }
    });
  }

  backToTutorials(): void {
    this.router.navigate(['/courses']);
  }

  onCardImageError(ev: Event): void {
    const el = ev.target as HTMLImageElement | null;
    if (el) el.style.visibility = 'hidden';
  }

  goToLearning(): void {
    if (!this.course?.id) return;
    this.router.navigate(['/student', 'course', this.course.id, 'learn']);
  }

  enroll(): void {
    const token = sessionStorage.getItem('token');
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }
    if (this.role !== 'student') {
      alert('Only students can enroll in courses.');
      return;
    }
    const courseId = Number(this.course.id);
    this.courseService.enroll(courseId).subscribe({
      next: (res: any) => {
        const enrollmentId =
          res?.enrollmentId || res?.data?.enrollmentId || res?.data?.id;
        if (!enrollmentId) {
          alert(res?.message || 'Enrollment ID not found');
          return;
        }
        if (
          res?.message &&
          String(res.message).toLowerCase().includes('already enrolled')
        ) {
          alert('You are already enrolled in this course!');
          return;
        }
        this.initiatePayment(enrollmentId, this.course.title);
      },
      error: (err: any) => {
        alert(err?.error?.message || 'Enrollment failed.');
      }
    });
  }

  private initiatePayment(enrollmentId: number, courseTitle: string): void {
    this.courseService.createOrder({ enrollment_id: enrollmentId }).subscribe({
      next: (order: any) => {
        const options = {
          key: order.key,
          amount: order.amount * 100,
          currency: 'INR',
          name: 'Course Hub',
          description: courseTitle,
          order_id: order.orderId,
          handler: (response: any) => {
            this.verifyAndComplete(enrollmentId, response);
          },
          theme: { color: '#3399cc' }
        };
        const rzp = new Razorpay(options);
        rzp.open();
      },
      error: (err: any) => {
        alert(err?.error?.message || 'Order creation failed');
      }
    });
  }

  private verifyAndComplete(enrollmentId: number, razorResponse: any): void {
    const verifyData = {
      enrollment_id: enrollmentId,
      razorpay_order_id: razorResponse.razorpay_order_id,
      razorpay_payment_id: razorResponse.razorpay_payment_id,
      razorpay_signature: razorResponse.razorpay_signature
    };
    this.courseService.verifyPayment(verifyData).subscribe({
      next: (res: any) => {
        alert('Payment verified! Your course is unlocked.');
        this.ngZone.run(() => {
          this.router.navigate(['/receipt', res.enrollment_id]);
        });
      },
      error: (err) => {
        alert(err?.error?.message || 'Verification failed.');
      }
    });
  }
}

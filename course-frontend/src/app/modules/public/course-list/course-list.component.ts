import { Component, OnInit } from '@angular/core';
import { CourseService } from 'src/app/services/course.service';
import { Router } from '@angular/router';
import { NgZone } from '@angular/core';
declare var Razorpay: any;

@Component({
  selector: 'app-course-list',
  templateUrl: './course-list.component.html',
  styleUrls: ['./course-list.component.css']
})
export class CourseListComponent implements OnInit {
  courses: any[] = [];
  role = sessionStorage.getItem('role');
  isLoggedIn = !!sessionStorage.getItem('token');

  constructor(
    private courseService: CourseService,
    private router: Router,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.loadCourses();
  }

  loadCourses(): void {
    this.courseService.getCourses().subscribe({
      next: (data: any[]) => {
        this.courses = data;
      },
      error: (err) => {
        console.error('Error loading courses:', err);
      }
    });
  }

  enroll(course: any): void {
    const token = sessionStorage.getItem('token');
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    const role = sessionStorage.getItem('role');
    if (role !== 'student') {
      alert('Sirf Student enroll kar sakta hai!');
      return;
    }

    const courseId = Number(course.id);
    console.log('STEP 1: Attempting Enrollment for Course ID:', courseId);

    this.courseService.enroll(courseId).subscribe({
      next: (res: any) => {
        console.log('STEP 2 SUCCESS:', res);

        const enrollmentId =
          res?.enrollmentId ||
          res?.data?.enrollmentId ||
          res?.data?.id;

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

        this.initiatePayment(enrollmentId, course.title);
      },
      error: (err: any) => {
        console.error('ENROLL API ERROR:', err);
        alert(err?.error?.message || 'Server Error. Please check backend logs.');
      }
    });
  }

  initiatePayment(enrollmentId: number, courseTitle: string): void {
    this.courseService.createOrder({ enrollment_id: enrollmentId }).subscribe({
      next: (order: any) => {
        console.log('STEP 3: ORDER CREATED:', order);

        const options = {
          key: order.key,
          amount: order.amount * 100,
          currency: 'INR',
          name: 'Course Hub',
          description: courseTitle,
          order_id: order.orderId,
          handler: (response: any) => {
            console.log('STEP 4: GATEWAY SUCCESS', response);
            this.verifyAndComplete(enrollmentId, response);
          },
          theme: { color: '#3399cc' }
        };

        const rzp = new Razorpay(options);
        rzp.open();
      },
      error: (err: any) => {
        console.error('Order Creation Error:', err);
        alert(err?.error?.message || 'Order creation failed');
      }
    });
  }

  onCardImageError(ev: Event): void {
    const el = ev.target as HTMLImageElement | null;
    if (el) el.style.visibility = 'hidden';
  }

  verifyAndComplete(enrollmentId: number, razorResponse: any): void {
    const verifyData = {
      enrollment_id: enrollmentId,
      razorpay_order_id: razorResponse.razorpay_order_id,
      razorpay_payment_id: razorResponse.razorpay_payment_id,
      razorpay_signature: razorResponse.razorpay_signature
    };

    console.log('STEP 5: SENDING DATA TO BACKEND:', verifyData);

    this.courseService.verifyPayment(verifyData).subscribe({
      next: (res: any) => {
        alert('Payment Verified! Course Unlocked ✅');
        console.log('Backend response:', res);

        this.ngZone.run(() => {
          this.router.navigate(['/receipt', res.enrollment_id]);
        });
      },
      error: (err) => {
        console.error('Verification error (Check Node.js Terminal):', err);
        alert(
          err?.error?.message ||
            'Verification failed. Please check your Backend Node.js console for the exact error message.'
        );
      }
    });
  }
}
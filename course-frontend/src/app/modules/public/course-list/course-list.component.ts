// import { Component, OnInit } from '@angular/core';
// import { CourseService } from 'src/app/services/course.service';
// declare var Razorpay: any;
// @Component({
//   selector: 'app-course-list',
//   templateUrl: './course-list.component.html',
//   styleUrls: ['./course-list.component.css']
// })
// export class CourseListComponent implements OnInit {

//   courses: any[] = [];

//   constructor(private courseService: CourseService) {}

//   ngOnInit(): void {
//     // ✅ ENROLL METHOD

//     this.courseService.getCourses().subscribe({
//       next: (data: any[]) => {
//         this.courses = data; // ✅ Directly use backend data
//       },
//       error: (err) => {
//         console.error('Error loading courses:', err);
//       }
//     });
//   }

// //  enroll(courseId: number) {
// //   console.log("STEP 1 clicked:", courseId);

// //   this.courseService.enroll(courseId).subscribe({
// //     next: (res: any) => {
// //       console.log("STEP 2 SUCCESS:", res);
// //       alert("Enrollment created");
// //     },
// //     error: (err: any) => {
// //       console.log("STEP 2 ERROR:", err);
// //     }
// //   });

// //   console.log("STEP 3 after subscribe");
// // }




// enroll(course: any) {
//   console.log("STEP 1 clicked:", course.id);

//   // 1️⃣ Create enrollment (your existing working part)
//   this.courseService.enroll(course.id).subscribe({
//     next: (res: any) => {
//       console.log("STEP 2 SUCCESS:", res);

//       const enrollmentId = res.enrollmentId;

//       // 2️⃣ Create Razorpay order (NEW)
//       this.courseService.createOrder({
//         enrollment_id: enrollmentId
//       }).subscribe({
//         next: (order: any) => {

//           console.log("ORDER CREATED:", order);

//           // 3️⃣ Open Razorpay popup
//           const options = {
//             key: order.key,
//             amount: order.amount * 100,
//             currency: "INR",
//             name: "Course Platform",
//             description: course.title,
//             order_id: order.orderId,

//             handler: (response: any) => {

//               console.log("PAYMENT SUCCESS:", response);

//               // 4️⃣ Verify payment
//               this.courseService.verifyPayment({
//                 enrollment_id: enrollmentId,
//                 razorpay_payment_id: response.razorpay_payment_id
//               }).subscribe({
//                 next: () => {
//                   alert("Payment Successful 🎉");

//                   // 5️⃣ Download receipt
//                   window.open(`http://localhost:5000/api/payment/receipt/${enrollmentId}`);
//                 },
//                 error: (err: any) => {
//                   console.error("Verification error:", err);
//                 }
//               });
//             }
//           };

//           const rzp = new Razorpay(options);
//           rzp.open();
//         },
//         error: (err: any) => {
//           console.error("Order error:", err);
//         }
//       });

//     },
//     error: (err: any) => {
//       console.log("STEP 2 ERROR:", err);
//     }
//   });

//   console.log("STEP 3 after subscribe");
// }
// }




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

  constructor(private courseService: CourseService,  private router: Router,  private ngZone: NgZone ) {
    
  }

  ngOnInit(): void {
    this.loadCourses();
  }

  loadCourses() {
    this.courseService.getCourses().subscribe({
      next: (data: any[]) => { this.courses = data; },
      error: (err) => { console.error('Error loading courses:', err); }
    });
  }

  enroll(course: any) {
    // ✅ FIX: Ensure we use the numeric ID. 
    // This prevents the [object Object] error in your backend logs.
    const courseId = Number(course.id);
    console.log("STEP 1: Attempting Enrollment for Course ID:", courseId);

    // 1️⃣ Step 1: Create the Enrollment record in Database
    // this.courseService.enroll(courseId).subscribe({
     
    //   error: (err: any) => {
    //     console.log("STEP 2 ERROR:", err);
    //     if (err.status === 400) {
    //       alert("You are already enrolled in this course!");
    //     } else {
    //       alert("Server Error. Please check backend logs.");
    //     }
    //   }
    // });

    this.courseService.enroll(courseId).subscribe({
  next: (res: any) => {
    console.log("STEP 2 SUCCESS:", res);

    const enrollmentId = res.enrollmentId;

    // 🔥 THIS LINE IS MISSING
    this.initiatePayment(enrollmentId, course.title);
  },

  error: (err: any) => {
    console.log("STEP 2 ERROR:", err);

    if (err.status === 400) {
      alert("You are already enrolled in this course!");
    } else {
      alert("Server Error. Please check backend logs.");
    }
  }
});
  }

//   initiatePayment(enrollmentId: number, courseTitle: string) {
//     // 2️⃣ Step 2: Create Razorpay Order
//     this.courseService.createOrder({ enrollment_id: enrollmentId }).subscribe({
//       next: (order: any) => {
//         console.log("STEP 3: ORDER CREATED:", order);

//         // 3️⃣ Step 3: Open Razorpay Popup
//         const options = {
//           key: order.key,
//           amount: order.amount * 100, // Razorpay expects paise
//           currency: "INR",
//           name: "Course Hub",
//           description: courseTitle,
//           order_id: order.orderId,
//           handler: (response: any) => {
//             console.log("STEP 4: PAYMENT SUCCESS FROM GATEWAY:", response);
//             this.verifyAndComplete(enrollmentId, response.razorpay_payment_id);
//           },
//           theme: { color: "#3399cc" }
//         };

//         const rzp = new Razorpay(options);
//         rzp.open();
//       },
//       error: (err: any) => {
//         console.error("Order Creation Error:", err);
//         alert("Failed to initialize payment gateway.");
//       }
//     });
//   }

//   // verifyAndComplete(enrollmentId: number, paymentId: string) {
//   //   // 4️⃣ Step 4: Verify on Backend
//   //   this.courseService.verifyPayment({
//   //     enrollment_id: enrollmentId,
//   //     razorpay_payment_id: paymentId
//   //   }).subscribe({
//   //     next: () => {
//   //       alert("Payment Verified! Course Unlocked ✅");
//   //       // 5️⃣ Optional: Download Receipt
//   //       window.open(`http://localhost:5000/api/payment/receipt/${enrollmentId}`);
//   //     },
//   //     error: (err: any) => {
//   //       console.error("Verification error:", err);
//   //       alert("Payment verification failed. Please contact support.");
//   //     }
//   //   });
//   // }


//   // Ensure you are sending all three required fields
// verifyAndComplete(enrollmentId: number, razorResponse: any) {
//   const verifyData = {
//     enrollment_id: enrollmentId,
//     razorpay_order_id: razorResponse.razorpay_order_id,
//     razorpay_payment_id: razorResponse.razorpay_payment_id,
//     razorpay_signature: razorResponse.razorpay_signature
//   };

//   this.courseService.verifyPayment(verifyData).subscribe({
//     next: () => {
//       alert("Payment Verified! Course Unlocked ✅");
//       window.open(`http://localhost:5000/api/payment/receipt/${enrollmentId}`);
//     },
//     error: (err) => {
//       console.error("Verification error:", err); // This is where you see the 500
//     }
//   });
// }


initiatePayment(enrollmentId: number, courseTitle: string) {
    this.courseService.createOrder({ enrollment_id: enrollmentId }).subscribe({
      next: (order: any) => {
        console.log("STEP 3: ORDER CREATED:", order);

        const options = {
          key: order.key,
          amount: order.amount * 100, 
          currency: "INR",
          name: "Course Hub",
          description: courseTitle,
          order_id: order.orderId,
          handler: (response: any) => {
            // ✅ FIX: Pass the WHOLE response object, not just the paymentId
            console.log("STEP 4: GATEWAY SUCCESS", response);
            this.verifyAndComplete(enrollmentId, response); 
          },
          theme: { color: "#3399cc" }
        };

        const rzp = new Razorpay(options);
        rzp.open();
      },
      error: (err: any) => {
        console.error("Order Creation Error:", err);
      }
    });
  }
verifyAndComplete(enrollmentId: number, razorResponse: any) {
  // ✅ We must send these exact 4 fields for the backend to succeed
  const verifyData = {
    enrollment_id: enrollmentId,
    razorpay_order_id: razorResponse.razorpay_order_id,
    razorpay_payment_id: razorResponse.razorpay_payment_id,
    razorpay_signature: razorResponse.razorpay_signature
  };

  console.log("STEP 5: SENDING DATA TO BACKEND:", verifyData);

  this.courseService.verifyPayment(verifyData).subscribe({
    next: (res: any) => {
    alert("Payment Verified! Course Unlocked ✅");

    console.log("Backend response:", res);

   this.ngZone.run(() => {
  this.router.navigate(['/receipt', res.enrollment_id]);
});
  },
    error: (err) => {
      console.error("Verification error (Check Node.js Terminal):", err);
      alert("Verification failed. Please check your Backend Node.js console for the exact error message.");
    }
  });
}
}
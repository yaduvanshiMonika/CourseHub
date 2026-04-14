// import { Injectable } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { throwError } from 'rxjs';

// @Injectable({
//   providedIn: 'root'
// })
// export class CourseService {

//   private apiUrl = 'http://localhost:5000/api'; // ✅ FIXED

//   constructor(private http: HttpClient) {}

//   // ✅ 1. HELPER METHOD (The one that was missing)
//   private getHeaders() {
//     const token = localStorage.getItem('token');
//     return new HttpHeaders({
//       'Authorization': `Bearer ${token}`
//     });
//   }
//   // ✅ GET ONLY PUBLISHED COURSES
//   getCourses() {
//     return this.http.get<any[]>(`${this.apiUrl}/courses/public`);
//   }

//   // ✅ GET SINGLE COURSE
//   getCourseById(id: number) {
//     return this.http.get<any>(`${this.apiUrl}/courses/${id}`);
//   }

// // ✅ ENROLL COURSE (Fixed with headers and response type)
// // ✅ ENROLL COURSE - UPDATED
// enroll(courseId: number) {
//   const token = localStorage.getItem('token'); 
  
//   // Guard: Don't even hit the server if the user isn't logged in
//   if (!token) {
//     console.error("No authentication token found!");
//     return throwError(() => new Error('Please login first'));
//   }

//   return this.http.post(`${this.apiUrl}/enroll`, 
//     { course_id: courseId }, 
//     {
//       headers: {
//         'Authorization': `Bearer ${token}` // Ensure "Bearer " prefix is here
//       }
//     }
//   );
// }



// // ✅ CHECK ACCESS
// checkAccess(courseId: number) {
//   const token = localStorage.getItem('token') || '';

//   return this.http.get(`${this.apiUrl}/enroll/status/${courseId}`, {
//    headers: {
//   Authorization: `Bearer ${token}`
// }
//   });
// }

// // 🔥 MISSING METHOD - ADD THIS NOW
//   createOrder(data: { enrollment_id: number }) {
//     return this.http.post(`${this.apiUrl}/payment/create-order`, data, {
//       headers: this.getHeaders()
//     });
//   }

// // ✅ VERIFY PAYMENT
// verifyPayment(data: any) {
//   const token = localStorage.getItem('token') || '';

//   return this.http.post(`${this.apiUrl}/payment/verify`, data, {
//     headers: {
//      Authorization: `Bearer ${token}` 
//     }
//   });
// }
// }



import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CourseService {
  private apiUrl = 'http://localhost:5000/api';

  constructor(private http: HttpClient) {}

  // Centralized Helper for Auth Headers
  private getHeaders() {
    const token = sessionStorage.getItem('token') || '';
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  getCourses() {
    return this.http.get<any[]>(`${this.apiUrl}/courses/public`);
  }

  getCourseById(id: number) {
    return this.http.get<any>(`${this.apiUrl}/courses/${id}`);
  }

  // ✅ ENROLL: Fixed to only send the numeric ID
  enroll(courseId: number) {
    const token = sessionStorage.getItem('token'); 
    if (!token) return throwError(() => new Error('Please login first'));

    return this.http.post(`${this.apiUrl}/enroll`, 
      { course_id: courseId }, // Sends { "course_id": 10 }
      { headers: this.getHeaders() }
    );
  }

  // ✅ CREATE ORDER: For Razorpay
  createOrder(data: { enrollment_id: number }) {
    return this.http.post(`${this.apiUrl}/payments/create-order`, data, {
      headers: this.getHeaders()
    });
  }

  // ✅ VERIFY PAYMENT
  verifyPayment(data: any) {
    return this.http.post(`${this.apiUrl}/payments/verify`, data, {
      headers: this.getHeaders()
    });
  }

  checkAccess(courseId: number) {
    return this.http.get(`${this.apiUrl}/enroll/status/${courseId}`, {
      headers: this.getHeaders()
    });
  }
}
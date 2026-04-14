// import { Injectable } from '@angular/core';
// import { HttpClient, HttpHeaders } from '@angular/common/http';
// import { Observable } from 'rxjs';

// @Injectable({
//   providedIn: 'root'
// })
// export class AdminService {
  
//   private apiUrl = 'http://localhost:5000/api/admin'; 

//   constructor(private http: HttpClient) { }

//   /**
//    * ✅ Attach Bearer Token
//    */
//   private getOptions() {
//     const token = localStorage.getItem('token');
//     return {
//       headers: new HttpHeaders({
//         'Authorization': `Bearer ${token}`
//       })
//     };
//   }
//   // ✅ GENERIC DELETE (Works for Users, Teachers, Courses)
// deleteContent(table: string, id: number): Observable<any> {
//   // Uses 'getOptions()' to attach the required Bearer token
//   return this.http.delete(`${this.apiUrl}/${table}/${id}`, this.getOptions());
// }

// // ✅ GENERIC UPDATE (Works for any item with an ID)
// updateItem(table: string, id: number, data: any): Observable<any> {
//   return this.http.put(`${this.apiUrl}/${table}/${id}`, data, this.getOptions());
// }

//   // ============================
//   // 📥 1. FETCH DATA (DYNAMIC)
//   // ============================
//   getDataByTable(table: string): Observable<any[]> {
//     return this.http.get<any[]>(`${this.apiUrl}/${table}`, this.getOptions());
//   }

//   // ============================
//   // 👩‍🏫 2. SAVE TEACHER
//   // ============================
//   saveTeacher(teacherData: any): Observable<any> {
//     return this.http.post(`${this.apiUrl}/teachers`, teacherData, this.getOptions());
//   }

//   // ============================
//   // 📚 3. UPLOAD COURSE
//   // ============================
// uploadCourse(title: string, category: string, instructor: string, file: File | null, status: string) {
//   const formData = new FormData();

//   formData.append('title', title);
//   formData.append('category', category);
//   formData.append('instructor', instructor);
//   formData.append('status', status);

//   if (file) {
//     formData.append('file', file);
//   }

//   const token = localStorage.getItem('token'); // 🔥 GET TOKEN

//   return this.http.post(
//     'http://localhost:5000/api/admin/courses/add',
//     formData,
//     {
//       headers: {
//         Authorization: `Bearer ${token}` // 🔥 SEND TOKEN
//       }
//     }
//   );
// }
//   // ============================
//   // 🗑️ 4. DELETE
//   // ============================
//   // deleteContent(table: string, id: number): Observable<any> {
//   //   return this.http.delete(`${this.apiUrl}/${table}/${id}`, this.getOptions());
//   // }

//   // ============================
//   // 🔄 5. RESTORE USER
//   // ============================
//   restoreUser(id: number): Observable<any> {
//     return this.http.put(`${this.apiUrl}/users/restore/${id}`, {}, this.getOptions());
//   }

//   // ============================
//   // 💳 6. SAVE PAYMENT (NEW 🔥)
//   // ============================
//   savePayment(paymentData: any): Observable<any> {
//     return this.http.post(`${this.apiUrl}/payments/add`, paymentData, this.getOptions());
//   }

//   // ============================
//   // 👨‍🏫 7. GET TEACHERS (OPTIONAL)
//   // ============================
//   getTeachers(): Observable<any[]> {
//     return this.http.get<any[]>(`${this.apiUrl}/teachers`, this.getOptions());
//   }

//   // ============================
//   // 👨‍🎓 8. STUDENTS + COURSES (ADVANCED)
//   // ============================
//   getStudentsWithCourses(): Observable<any[]> {
//     return this.http.get<any[]>(`${this.apiUrl}/users-with-courses`, this.getOptions());
//   }
//   updateCourse(courseData: any) {
//   return this.http.put(
//     `${this.apiUrl}/courses/${courseData.id}`,
//     courseData,
//     this.getOptions()
//   );
// }
// // GET CONTENT BY COURSE
// getCourseContent(courseId: number) {
//   return this.http.get<any[]>(
//     `${this.apiUrl}/course-content/${courseId}`,
//     this.getOptions()
//   );
// }

// // DELETE CONTENT
// deleteCourseContent(id: number) {
//   return this.http.delete(
//     `${this.apiUrl}/course-content/${id}`,
//     this.getOptions()
//   );
// }
// updateTeacher(data: any) {
//   return this.http.put(
//     `${this.apiUrl}/teachers/${data.id}`,
//     data,
//     this.getOptions()
//   );
  
// }
// // ============================
// // 👨‍🎓 SAVE STUDENT (FIXED 🔥)
// // ============================
// saveStudent(data: any) {
//   // 1. Use the apiUrl variable for consistency
//   // 2. MUST include this.getOptions() to send the token
//   return this.http.post(`${this.apiUrl}/users`, data, this.getOptions());
// }
// // ============================
// // 👨‍🎓 9. UPDATE STUDENT (FIXED 🔥)
// // ============================
// updateStudent(data: any) {
//   return this.http.put(
//     `${this.apiUrl}/users/${data.id}`,
//     data,
//     this.getOptions() // ✅ THIS WAS MISSING
//   );
// }
// }




import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdminService {

  private apiUrl = 'http://localhost:5000/api/admin';

  constructor(private http: HttpClient) {}

  /**
   * ✅ Attach Bearer Token
   */
  private getOptions() {
    const token = sessionStorage.getItem('token');
    return {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${token}`
      })
    };
  }

  // ============================
  // 📥 1. FETCH DATA (DYNAMIC)
  // ============================
  getDataByTable(table: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${table}`, this.getOptions());
  }

  // ============================
  // 👩‍🏫 2. SAVE TEACHER
  // ============================
  saveTeacher(teacherData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/teachers`, teacherData, this.getOptions());
  }

  // ============================
  // ✏️ UPDATE TEACHER
  // ============================
  updateTeacher(data: any): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/teachers/${data.id}`,
      data,
      this.getOptions()
    );
  }

  // ============================
  // 👨‍🎓 SAVE STUDENT
  // ============================
  saveStudent(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/users`, data, this.getOptions());
  }

  // ============================
  // ✏️ UPDATE STUDENT
  // ============================
  updateStudent(data: any): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/users/${data.id}`,
      data,
      this.getOptions()
    );
  }

  // ============================
  // 📚 UPLOAD COURSE (IMPORTANT)
  // ============================
  uploadCourse(
    title: string,
    category: string,
    instructor: string,
    file: File | null,
    status: string
  ): Observable<any> {

    const formData = new FormData();

    formData.append('title', title);
    formData.append('category', category);
    formData.append('instructor', instructor);
    formData.append('status', status);

    if (file) {
      formData.append('file', file);
    }

    return this.http.post(
      `${this.apiUrl}/courses/add`,
      formData,
      this.getOptions()
    );
  }

  // ============================
  // ✏️ UPDATE COURSE
  // ============================
  updateCourse(courseData: any): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/courses/${courseData.id}`,
      courseData,
      this.getOptions()
    );
  }

  // ============================
  // 🗑️ DELETE (GENERIC)
  // ============================
  deleteContent(table: string, id: number): Observable<any> {
    return this.http.delete(
      `${this.apiUrl}/${table}/${id}`,
      this.getOptions()
    );
  }

  // ============================
  // 🔄 RESTORE USER
  // ============================
  restoreUser(id: number): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/users/restore/${id}`,
      {},
      this.getOptions()
    );
  }

  // ============================
  // 💳 SAVE PAYMENT
  // ============================
  savePayment(paymentData: any): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/payments/add`,
      paymentData,
      this.getOptions()
    );
  }

  // ============================
  // 👨‍🏫 GET TEACHERS
  // ============================
  getTeachers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/teachers`, this.getOptions());
  }

  // ============================
  // 👨‍🎓 STUDENTS WITH COURSES
  // ============================
  getStudentsWithCourses(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/users-with-courses`, this.getOptions());
  }

  // ============================
  // 📺 GET COURSE CONTENT
  // ============================
  getCourseContent(courseId: number): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.apiUrl}/course-content/${courseId}`,
      this.getOptions()
    );
  }

  // ============================
  // 🗑️ DELETE COURSE CONTENT
  // ============================
  deleteCourseContent(id: number): Observable<any> {
    return this.http.delete(
      `${this.apiUrl}/course-content/${id}`,
      this.getOptions()
    );
  }
  getPayments() {
  return this.http.get<any[]>('http://localhost:5000/api/payments');
}
}
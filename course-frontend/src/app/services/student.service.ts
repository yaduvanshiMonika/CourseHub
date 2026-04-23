import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class StudentService {
  private baseUrl = 'http://localhost:5000/api/student';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = sessionStorage.getItem('token');
    return new HttpHeaders({
      Authorization: `Bearer ${token || ''}`
    });
  }

  getAllCourses(): Observable<any> {
    return this.http.get(`${this.baseUrl}/courses`, {
      headers: this.getAuthHeaders()
    });
  }

  getCourseDetails(courseId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/courses/${courseId}`, {
      headers: this.getAuthHeaders()
    });
  }

  enrollCourse(courseId: number): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/enroll/${courseId}`,
      {},
      { headers: this.getAuthHeaders() }
    );
  }

  getStudentCourses(): Observable<any> {
    return this.http.get(`${this.baseUrl}/student-courses`, {
      headers: this.getAuthHeaders()
    });
  }

  getLearningPage(courseId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/course/${courseId}/learn`, {
      headers: this.getAuthHeaders()
    });
  }

  markLessonComplete(contentId: number): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/lesson/${contentId}/complete`,
      {},
      { headers: this.getAuthHeaders() }
    );
  }

  getCourseProgress(courseId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/course/${courseId}/progress`, {
      headers: this.getAuthHeaders()
    });
  }

  getStudentProfile(): Observable<any> {
    return this.http.get(`${this.baseUrl}/profile`, {
      headers: this.getAuthHeaders()
    });
  }

  updateStudentProfile(data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/profile`, data, {
      headers: this.getAuthHeaders()
    });
  }

  updateStudentPhoto(photo: string): Observable<any> {
    return this.http.put(
      `${this.baseUrl}/profile/photo`,
      { photo },
      { headers: this.getAuthHeaders() }
    );
  }

  getStudentCertificates(): Observable<any> {
    return this.http.get(`${this.baseUrl}/certificates`, {
      headers: this.getAuthHeaders()
    });
  }

  downloadCertificate(courseId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/certificate/${courseId}/download`, {
      headers: this.getAuthHeaders()
    });
  }

  downloadProtectedPdf(url: string): Observable<Blob> {
    return this.http.get(url, {
      headers: this.getAuthHeaders(),
      responseType: 'blob'
    });
  }
}
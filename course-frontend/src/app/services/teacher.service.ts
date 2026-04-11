
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TeacherService {
  private baseUrl = 'http://localhost:5000/api/teacher';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || '';
    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  addCourse(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/courses`, data, {
      headers: this.getHeaders()
    });
  }

  getMyCourses(): Observable<any> {
    return this.http.get(`${this.baseUrl}/courses`, {
      headers: this.getHeaders()
    });
  }

  updateCourse(courseId: number, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/courses/${courseId}`, data, {
      headers: this.getHeaders()
    });
  }

  deleteCourse(courseId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/courses/${courseId}`, {
      headers: this.getHeaders()
    });
  }

  addCourseContents(courseId: number, data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/courses/${courseId}/contents`, data, {
      headers: this.getHeaders()
    });
  }

  getCourseContents(courseId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/courses/${courseId}/contents`, {
      headers: this.getHeaders()
    });
  }

  updateCourseContent(contentId: number, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/contents/${contentId}`, data, {
      headers: this.getHeaders()
    });
  }

  deleteCourseContent(contentId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/contents/${contentId}`, {
      headers: this.getHeaders()
    });
  }

  getCourseEnrollments(courseId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/courses/${courseId}/enrollments`, {
      headers: this.getHeaders()
    });
  }
}
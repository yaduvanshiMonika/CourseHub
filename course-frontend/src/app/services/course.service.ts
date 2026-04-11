import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class CourseService {

  private apiUrl = 'http://localhost:5000/api'; // ✅ FIXED

  constructor(private http: HttpClient) {}

  // ✅ GET ONLY PUBLISHED COURSES
  getCourses() {
    return this.http.get<any[]>(`${this.apiUrl}/courses/public`);
  }

  // ✅ GET SINGLE COURSE
  getCourseById(id: number) {
    return this.http.get<any>(`${this.apiUrl}/courses/${id}`);
  }
}
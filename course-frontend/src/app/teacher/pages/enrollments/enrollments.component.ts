import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-enrollments',
  templateUrl: './enrollments.component.html',
  styleUrls: ['./enrollments.component.css']
})
export class EnrollmentsComponent implements OnInit {
  courseId: string = '';
  enrollments: any[] = [];
  errorMessage: string = '';

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.courseId = this.route.snapshot.paramMap.get('id') || '';
    this.fetchEnrollments();
  }

  fetchEnrollments(): void {
    const token = localStorage.getItem('token');

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    this.http.get(`http://localhost:5000/api/teacher/courses/${this.courseId}/enrollments`, { headers })
      .subscribe({
        next: (res: any) => {
          this.enrollments = res?.data || [];
        },
        error: (err) => {
          console.error(err);
          this.errorMessage = err?.error?.message || 'Enrollments fetch nahi huye';
        }
      });
  }
}
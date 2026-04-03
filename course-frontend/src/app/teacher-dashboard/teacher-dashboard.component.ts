import { Component } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-teacher-dashboard',
  templateUrl: './teacher-dashboard.component.html',
  styleUrls: ['./teacher-dashboard.component.css']
})
export class TeacherDashboardComponent {
  // Form Variables
  contentData = {
    course_id: '',
    title: '',
    type: 'video', // Default value
    url: ''
  };

  constructor(private http: HttpClient) {}

  handleUpload() {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.post('http://localhost:5000/api/teacher/upload-content', this.contentData, { headers })
      .subscribe({
        next: (res: any) => {
          alert('Lecture Uploaded Successfully! ✅');
          // Clear form
          this.contentData = { course_id: '', title: '', type: 'video', url: '' };
        },
        error: (err) => {
          console.error(err);
          alert('Upload Failed: ' + (err.error?.message || 'Server Error'));
        }
      });
  }
}
import { Component } from '@angular/core';
// import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {
  teacherName: string = 'Teacher';

  // constructor(private router: Router)
  constructor() {
    const name = localStorage.getItem('teacherName') || localStorage.getItem('name');
    if (name) {
      this.teacherName = name;
    }
  }

  // logout(): void {
  //   localStorage.removeItem('token');
  //   localStorage.removeItem('user');
  //   localStorage.removeItem('teacherName');
  //   localStorage.removeItem('name');
  //   this.router.navigate(['/login']);
  // }
}
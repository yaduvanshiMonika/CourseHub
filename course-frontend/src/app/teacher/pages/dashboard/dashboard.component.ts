// import { Component } from '@angular/core';
// // import { Router } from '@angular/router';

// @Component({
//   selector: 'app-dashboard',
//   templateUrl: './dashboard.component.html',
//   styleUrls: ['./dashboard.component.css']
// })
// export class DashboardComponent {
//   teacherName: string = 'Teacher';

//   // constructor(private router: Router)
//   constructor() {
//     const name = localStorage.getItem('teacherName') || localStorage.getItem('name');
//     if (name) {
//       this.teacherName = name;
//     }
//   }

  
// }


import { Component, HostListener, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  teacherName = 'Teacher';
  teacherInitial = 'T';
  menuOpen = false;

  constructor(private router: Router) {}

  ngOnInit(): void {
    const userData = localStorage.getItem('user');

    if (userData) {
      try {
        const user = JSON.parse(userData);
        this.teacherName = user?.name || 'Teacher';
      } catch (error) {
        this.teacherName = 'Teacher';
      }
    }

    this.teacherInitial = this.teacherName.charAt(0).toUpperCase();
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  goToSite(): void {
    this.menuOpen = false;
    this.router.navigate(['/']);
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.menuOpen = false;
    this.router.navigate(['/login']);
  }

  @HostListener('document:click')
  closeMenu(): void {
    this.menuOpen = false;
  }
}
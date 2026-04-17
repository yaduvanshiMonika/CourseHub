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

  // ngOnInit(): void {
  //   const userData = sessionStorage.getItem('user');

  //   if (userData) {
  //     try {
  //       const user = JSON.parse(userData);
  //       // this.teacherName = user?.name || 'Teacher';
  //       this.teacherName = user?.name || user?.fullName || user?.username || 'Teacher';
  //     } catch (error) {
  //       this.teacherName = 'Teacher';
  //     }
  //   }

  //   this.teacherInitial = this.teacherName.charAt(0).toUpperCase();
  // }
ngOnInit(): void {
  this.teacherName = sessionStorage.getItem('name') || 'Teacher';
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
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    this.menuOpen = false;
    this.router.navigate(['/login']);
  }

  @HostListener('document:click')
  closeMenu(): void {
    this.menuOpen = false;
  }
}
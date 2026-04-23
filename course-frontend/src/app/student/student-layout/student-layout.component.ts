import { Component, HostListener, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-student-layout',
  templateUrl: './student-layout.component.html',
  styleUrls: ['./student-layout.component.css']
})
export class StudentLayoutComponent implements OnInit {
  menuOpen = false;
  studentName: string = 'Student';
  studentInitial: string = 'S';

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.studentName = sessionStorage.getItem('name') || 'Student';
    this.studentInitial = this.studentName.charAt(0).toUpperCase();
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  @HostListener('document:click')
  closeMenu(): void {
    this.menuOpen = false;
  }

  goToSite(): void {
    this.menuOpen = false;
    this.router.navigate(['/']);
  }

  logout(): void {
    this.menuOpen = false;
    sessionStorage.clear();
    this.router.navigate(['/login']);
  }
}
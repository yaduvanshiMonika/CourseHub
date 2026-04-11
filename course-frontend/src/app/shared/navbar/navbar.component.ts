import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {

  constructor(private router: Router) { }
activeTab: string = 'home';
userName: string = '';
userRole: string = '';
showDropdown: boolean = false;
setActive(tab: string) {
  this.activeTab = tab;
}

scrollToContact() {
  this.activeTab = 'contact';

  const section = document.getElementById('contact');
  if (section) {
    section.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }
}
isLoggedIn(): boolean {
  return !!localStorage.getItem('token');
}

logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  localStorage.removeItem('name');
  alert('Logged out successfully');
  this.router.navigate(['/login']);
}

  ngOnInit(): void {
   this.userName = localStorage.getItem('name') || '';
  this.userRole = localStorage.getItem('role') || '';
  }
  toggleDropdown() {
  this.showDropdown = !this.showDropdown;
}

goToAdmin() {
  this.router.navigate(['/admin-dashboard']);
}

goToTeacher() {
  this.router.navigate(['/teacher-panel']);
}

}

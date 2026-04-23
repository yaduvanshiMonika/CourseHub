import { Component, OnInit, Input } from '@angular/core';
import { Router } from '@angular/router';
import { ThemeService } from 'src/app/services/theme.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {

  // ✅ Receives openLogin function from app.component
  @Input() showLoginFn!: () => void;

  constructor(private router: Router, public theme: ThemeService) {}

  activeTab: string = 'home';
  userName: string = '';
  userRole: string = '';
  showDropdown: boolean = false;

  ngOnInit(): void {
    this.userName = sessionStorage.getItem('name') || '';
    this.userRole = sessionStorage.getItem('role') || '';
  }

  setActive(tab: string) { this.activeTab = tab; }

  scrollToContact() {
    this.activeTab = 'contact';
    const section = document.getElementById('contact');
    if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  isLoggedIn(): boolean {
    return !!sessionStorage.getItem('token');
  }

  // ✅ Opens the login drawer instead of navigating
  openLogin() {
    if (this.showLoginFn) this.showLoginFn();
  }

  logout() {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('role');
    sessionStorage.removeItem('name');
    this.router.navigate(['/']);
  }

  toggleDropdown() { this.showDropdown = !this.showDropdown; }
  goToAdmin()   { this.router.navigate(['/admin-dashboard']); }
  goToTeacher() { this.router.navigate(['/teacher']); }
}
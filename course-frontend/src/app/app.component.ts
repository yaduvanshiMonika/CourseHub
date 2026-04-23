import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'course-frontend';
  isLoggedIn: boolean = false;
  showLogin: boolean = false;

  constructor(public router: Router, theme: ThemeService) {
    void theme;
  }

  ngDoCheck(): void {
    this.isLoggedIn = !!sessionStorage.getItem('token');
  }

  isAdminRoute(): boolean {
    return this.router.url.includes('admin-dashboard') ||
           this.router.url.includes('teacher');
  }

  openLogin()  { this.showLogin = true;  }
  closeLogin() { this.showLogin = false; }
}
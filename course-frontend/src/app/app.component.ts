
// import { Component } from '@angular/core';
// import { Router } from '@angular/router';

// @Component({
//   selector: 'app-root',
//   templateUrl: './app.component.html'
// })
// export class AppComponent {
//   title = 'course-frontend';

//   //add monika
//   isLoggedIn: boolean =false;
//   ngDoCheck(): void {
//     // this.isLoggedIn = !!localStorage.getItem('token');
//     this.isLoggedIn = !!sessionStorage.getItem('token');
//   }

//   constructor(private router: Router) {}

//   isAdminRoute(): boolean {
//     return this.router.url.includes('admin-dashboard') ||
//            this.router.url.includes('teacher');
//   }
// }


import { Component, DoCheck } from '@angular/core';
import { Router } from '@angular/router';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements DoCheck {
  title = 'course-frontend';
  isLoggedIn: boolean = false;

  showLogin: boolean = false;

  constructor(public router: Router, theme: ThemeService) {
    void theme;
  }

  ngDoCheck(): void {
    this.isLoggedIn = !!sessionStorage.getItem('token');
  }
  openLogin()  { this.showLogin = true;  }
  closeLogin() { this.showLogin = false; }

  isAdminRoute(): boolean {
    const url = this.router.url;

    return (
      url.includes('admin-dashboard') ||
      url.includes('teacher') ||
      url.includes('student')
    );
  }
}
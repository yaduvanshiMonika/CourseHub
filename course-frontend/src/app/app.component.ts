// import { Component } from '@angular/core';

// @Component({
//   selector: 'app-root',
//   templateUrl: './app.component.html',
//   styleUrls: ['./app.component.css']
// })
// export class AppComponent {
//   title = 'course-frontend';
// }


import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent {
  title = 'course-frontend';

  //add monika
  isLoggedIn: boolean =false;
  ngDoCheck(): void {
    this.isLoggedIn = !!localStorage.getItem('token');
  }

  constructor(private router: Router) {}

  isAdminRoute(): boolean {
    return this.router.url.includes('admin-dashboard') ||
           this.router.url.includes('teacher');
  }
}

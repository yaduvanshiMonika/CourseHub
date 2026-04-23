// import { Injectable } from '@angular/core';
// import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';

// @Injectable({
//   providedIn: 'root'
// })
// export class RoleGuard implements CanActivate {
  
//   constructor(private router: Router) {}

//   canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
//     const token = localStorage.getItem('token');

//     if (!token) {
//       this.router.navigate(['/login']);
//       return false;
//     }

//     try {
//       // Decode the JWT token payload (the middle part)
//       const payload = JSON.parse(atob(token.split('.')[1]));
//       const userRole = payload.role;

//       // Get the allowed roles from the route data in app-routing.module.ts
//       const expectedRoles = route.data['expectedRoles'];

//       if (expectedRoles && expectedRoles.includes(userRole)) {
//         return true; // Access granted
//       } else {
//         alert("Access Denied: You don't have permission for this section.");
//         this.router.navigate(['/']); // Send back to home
//         return false;
//       }
//     } catch (error) {
//       this.router.navigate(['/login']);
//       return false;
//     }
//   }
// }


import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {

    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return false;
    }

    const userRole = this.authService.getRole();
    const expectedRoles = route.data['expectedRoles'];

    if (expectedRoles.includes(userRole)) {
      return true;
    }

    // 🔁 Smart redirect
    if (userRole === 'admin') {
      this.router.navigate(['/admin-dashboard']);
    } else if (userRole === 'teacher') {
      this.router.navigate(['/teacher']);
    }
    else if(userRole === 'student'){
      this.router.navigate(['/student/student-dashboard'])
    } else {
      this.router.navigate(['/']);
    }

    return false;
  }
}
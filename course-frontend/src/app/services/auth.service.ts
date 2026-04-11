// import { Injectable } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { tap } from 'rxjs/operators';


// @Injectable({
//   providedIn: 'root'
// })
// export class AuthService {

//   baseUrl = 'http://localhost:5000/api/auth';

//   constructor(private http: HttpClient) {}

//   // ✅ LOGIN: Stores the token needed for Admin routes
//   login(data: any) {
//     return this.http.post(`${this.baseUrl}/login`, data).pipe(
//       tap((res: any) => {
//         if (res && res.token) {
//           localStorage.setItem('token', res.token);
//         }
//       })
//     );
//   }

//   register(data: any) {
//     return this.http.post(`${this.baseUrl}/register`, data);
//   }

//   logout() {
//     localStorage.removeItem('token');
//   }

//   isLoggedIn(): boolean {
//     return !!localStorage.getItem('token');
//   }

//   getToken(): string | null {
//     return localStorage.getItem('token');
//   }
// }





import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  baseUrl = 'http://localhost:5000/api/auth';

  constructor(private http: HttpClient) {}

  // ✅ LOGIN
  login(data: any) {
    return this.http.post(`${this.baseUrl}/login`, data).pipe(
      tap((res: any) => {
        if (res && res.token) {
          localStorage.setItem('token', res.token);

          // 🔥 ADD THESE (VERY IMPORTANT)
          localStorage.setItem('role', res.role);
          localStorage.setItem('name', res.name);
        }
      })
    );
  }

  // ✅ REGISTER
  register(data: any) {
    return this.http.post(`${this.baseUrl}/register`, data);
  }

  // ✅ LOGOUT
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('name');
  }

  // ✅ CHECK LOGIN
  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  // ✅ GET TOKEN
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  // 🔥 ADD THIS (FIXES YOUR ERROR)
  getRole(): string | null {
    return localStorage.getItem('role');
  }

  // 🔥 ROLE HELPERS
  isAdmin(): boolean {
    return this.getRole() === 'admin';
  }

  isTeacher(): boolean {
    return this.getRole() === 'teacher';
  }

  // ✅ OPTIONAL
  getName(): string | null {
    return localStorage.getItem('name');
  }
}
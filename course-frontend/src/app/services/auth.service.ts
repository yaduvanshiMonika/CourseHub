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
          // localStorage.setItem('token', res.token);
          sessionStorage.setItem('token', res.token);

          // 🔥 ADD THESE (VERY IMPORTANT)
          sessionStorage.setItem('role', res.role);
          sessionStorage.setItem('name', res.name);
          if (res.email) {
            sessionStorage.setItem('email', res.email);
          } else {
            sessionStorage.removeItem('email');
          }
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
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('role');
    sessionStorage.removeItem('name');
    sessionStorage.removeItem('email');
    localStorage.removeItem('token');
  }

  /** Decode JWT payload (browser-safe base64url). */
  private decodeJwtPayload(token: string): { exp?: number; role?: string } | null {
    try {
      const part = token.split('.')[1];
      if (!part) return null;
      const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
      return JSON.parse(atob(padded)) as { exp?: number; role?: string };
    } catch {
      return null;
    }
  }

  /** True if token exists and `exp` is still in the future (with small clock skew). */
  isLoggedIn(): boolean {
    const token =
      sessionStorage.getItem('token') || localStorage.getItem('token');
    if (!token) return false;
    const payload = this.decodeJwtPayload(token);
    if (!payload) {
      this.logout();
      return false;
    }
    const exp = payload.exp;
    if (typeof exp !== 'number') return true;
    const skewMs = 15_000;
    if (exp * 1000 <= Date.now() + skewMs) {
      this.logout();
      return false;
    }
    return true;
  }

  // ✅ GET TOKEN
  getToken(): string | null {
    return sessionStorage.getItem('token') || localStorage.getItem('token');
  }

  getRole(): string | null {
    const fromSession = sessionStorage.getItem('role');
    if (fromSession) return fromSession;
    const token = this.getToken();
    if (!token) return null;
    return this.decodeJwtPayload(token)?.role ?? null;
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
    return sessionStorage.getItem('name');
  }

  getEmail(): string | null {
    return sessionStorage.getItem('email');
  }
}
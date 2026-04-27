import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpErrorResponse
} from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * If an authenticated request returns 401 (e.g. expired JWT), clear session and go to login.
 * Skips requests without Authorization (e.g. public login) so wrong-password 401 is unaffected.
 */
@Injectable()
export class AuthExpiredInterceptor implements HttpInterceptor {
  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler) {
    return next.handle(req).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === 401 && req.headers.has('Authorization')) {
          this.auth.logout();
          const url = this.router.url || '';
          if (!url.includes('/login')) {
            this.router.navigate(['/login']);
          }
        }
        return throwError(() => err);
      })
    );
  }
}

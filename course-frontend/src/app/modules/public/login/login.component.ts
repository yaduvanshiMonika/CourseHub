// import { Component } from '@angular/core';
// import { AuthService } from '../../../services/auth.service';
// import { Router } from '@angular/router';
// import Swal from 'sweetalert2';

// @Component({
//   selector: 'app-login',
//   templateUrl: './login.component.html',
//   styleUrls: ['./login.component.css']
// })
// export class LoginComponent {
//   isLogin  = true;
//   name     = '';
//   email    = '';
//   password = '';

//   constructor(private authService: AuthService, private router: Router) {}

//   toggleMode() {
//     this.isLogin = !this.isLogin;
//     this.name = this.email = this.password = '';
//   }

//   // ─────────────────────────────────────────
//   //  SINGLE POPUP HELPER — used everywhere
//   //  type: 'warn' | 'success' | 'error'
//   // ─────────────────────────────────────────
//   private popup(
//     type: 'warn' | 'success' | 'error',
//     title: string,
//     text: string,
//     timer = 2500
//   ): Promise<any> {

//     const icons: any = {
//       warn:    '⚠️',
//       success: '✅',
//       error:   '❌',
//     };

//     const colors: any = {
//       warn:    'rgba(255,170,50,0.9)',
//       success: 'rgba(68,221,136,0.9)',
//       error:   'rgba(255,90,90,0.9)',
//     };

//     return Swal.fire({
//       showConfirmButton: false,
//       timer,
//       timerProgressBar: true,
//       position: 'center',
//       background: 'transparent',
//       backdrop: 'rgba(0,0,0,0.5)',
//       customClass: { popup: 'swal-naked' },
//       html: `
//         <div style="
//           background: rgba(15,18,30,0.55);
//           backdrop-filter: blur(22px);
//           -webkit-backdrop-filter: blur(22px);
//           border: 1px solid rgba(255,255,255,0.12);
//           border-radius: 18px;
//           padding: 22px 20px 18px;
//           text-align: center;
//           box-shadow: 0 12px 40px rgba(0,0,0,0.45);
//         ">
//           <div style="font-size:26px; line-height:1; margin-bottom:10px;">${icons[type]}</div>
//           <div style="
//             font-size:13px;
//             font-weight:700;
//             color:${colors[type]};
//             margin-bottom:6px;
//             letter-spacing:0.02em;
//           ">${title}</div>
//           <div style="
//             font-size:11.5px;
//             color:rgba(255,255,255,0.6);
//             line-height:1.55;
//           ">${text}</div>
//         </div>
//       `,
//     });
//   }

//   // ─────────────────────────────────────────
//   //  VALIDATION HELPERS
//   // ─────────────────────────────────────────
//   private isValidEmail(e: string): boolean {
//     return /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(e.trim());
//   }

//   private validateLogin(): boolean {
//     if (!this.email.trim())           { this.popup('warn', 'Email Required',    'Please enter your email address.');                        return false; }
//     if (!this.isValidEmail(this.email)) { this.popup('warn', 'Invalid Email',   'Enter a valid email e.g. user@example.com');               return false; }
//     if (!this.password.trim())        { this.popup('warn', 'Password Required', 'Please enter your password.');                             return false; }
//     if (this.password.length < 6)     { this.popup('warn', 'Password Too Short','Password must be at least 6 characters.');                 return false; }
//     return true;
//   }

//   private validateRegister(): boolean {
//     if (!this.name.trim())              { this.popup('warn', 'Name Required',       'Please enter your full name.');                          return false; }
//     if (this.name.trim().length < 2)    { this.popup('warn', 'Invalid Name',        'Name must be at least 2 characters.');                   return false; }
//     if (!this.email.trim())             { this.popup('warn', 'Email Required',      'Please enter your email address.');                      return false; }
//     if (!this.isValidEmail(this.email)) { this.popup('warn', 'Invalid Email',       'Enter a valid email e.g. user@example.com');             return false; }
//     if (!this.password.trim())          { this.popup('warn', 'Password Required',   'Please create a password.');                             return false; }
//     if (this.password.length < 6)       { this.popup('warn', 'Weak Password',       'Password must be at least 6 characters.');               return false; }
//     if (!/[A-Z]/.test(this.password))   { this.popup('warn', 'Weak Password',       'Must contain at least one uppercase letter (A–Z).');     return false; }
//     if (!/[0-9]/.test(this.password))   { this.popup('warn', 'Weak Password',       'Must contain at least one number (0–9).');               return false; }
//     return true;
//   }

//   // ─────────────────────────────────────────
//   //  SUBMIT
//   // ─────────────────────────────────────────
//   handleSubmit() {
//     if (this.isLogin) {
//       if (!this.validateLogin()) return;
//     } else {
//       if (!this.validateRegister()) return;
//     }

//     const authData = {
//       name:     this.isLogin ? undefined : this.name.trim(),
//       email:    this.email.trim(),
//       password: this.password,
//     };

//     // ── LOGIN ──────────────────────────────
//     if (this.isLogin) {
//       this.authService.login(authData).subscribe({
//         next: (res: any) => {
//           sessionStorage.setItem('token', res.token);
//           sessionStorage.setItem('role',  res.role);
//           sessionStorage.setItem('name',  res.name);

//           this.popup('success', `Welcome, ${res.name || 'User'}! 👋`, 'Logged in successfully.', 1800)
//             .then(() => {
//               if (res.role === 'admin')        this.router.navigate(['/admin-dashboard']);
//               else if (res.role === 'teacher') this.router.navigate(['/teacher']);
//               else                             this.router.navigate(['/']);
//             });
//         },
//         error: (err: any) => {
//           const msg = (err.error?.message || '').toLowerCase();
//           if (msg.includes('password'))
//             this.popup('error', 'Wrong Password', 'The password you entered is incorrect.');
//           else if (msg.includes('user') || msg.includes('not found') || msg.includes('email'))
//             this.popup('error', 'Account Not Found', 'No account with this email. Please register first.');
//           else
//             this.popup('error', 'Login Failed', err.error?.message || 'Something went wrong.');
//         }
//       });

//     // ── REGISTER ───────────────────────────
//     } else {
//       this.authService.register(authData).subscribe({
//         next: () => {
//           this.popup('success', 'Account Created! 🎉', 'Your account is ready. You can now log in.', 2000)
//             .then(() => {
//               this.isLogin = true;
//               this.name = this.email = this.password = '';
//             });
//         },
//         error: (err) => {
//           const msg = (err.error?.message || '').toLowerCase();
//           if (msg.includes('exist') || msg.includes('duplicate') || msg.includes('already'))
//             this.popup('error', 'Email Already Registered', 'This email is in use. Please log in instead.');
//           else
//             this.popup('error', 'Registration Failed', err.error?.message || 'Something went wrong.');
//         }
//       });
//     }
//   }
// }


import { Component, Output, EventEmitter } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {

  // ✅ Emits to app.component to close the drawer
  @Output() closeOverlay = new EventEmitter<void>();

  isLogin  = true;
  name     = '';
  email    = '';
  password = '';

  constructor(private authService: AuthService, private router: Router) {}

  toggleMode() {
    this.isLogin = !this.isLogin;
    this.name = this.email = this.password = '';
  }

  private popup(type: 'warn'|'success'|'error', title: string, text: string, timer = 2500): Promise<any> {
    const icons: any  = { warn:'⚠️', success:'✅', error:'❌' };
    const colors: any = { warn:'rgba(255,170,50,0.9)', success:'rgba(68,221,136,0.9)', error:'rgba(255,90,90,0.9)' };
    return Swal.fire({
      showConfirmButton: false, timer, timerProgressBar: true,
      position: 'center', background: 'transparent', backdrop: 'rgba(0,0,0,0.5)',
      customClass: { popup: 'swal-naked' },
      html: `<div style="background:rgba(15,18,30,0.55);backdrop-filter:blur(22px);-webkit-backdrop-filter:blur(22px);border:1px solid rgba(255,255,255,0.12);border-radius:18px;padding:22px 20px 18px;text-align:center;box-shadow:0 12px 40px rgba(0,0,0,0.45);">
        <div style="font-size:26px;line-height:1;margin-bottom:10px;">${icons[type]}</div>
        <div style="font-size:13px;font-weight:700;color:${colors[type]};margin-bottom:6px;">${title}</div>
        <div style="font-size:11.5px;color:rgba(255,255,255,0.6);line-height:1.55;">${text}</div>
      </div>`,
    });
  }

  private isValidEmail(e: string): boolean {
    return /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(e.trim());
  }

  private validateLogin(): boolean {
    if (!this.email.trim())             { this.popup('warn','Email Required','Please enter your email address.'); return false; }
    if (!this.isValidEmail(this.email)) { this.popup('warn','Invalid Email','Enter a valid email e.g. user@example.com'); return false; }
    if (!this.password.trim())          { this.popup('warn','Password Required','Please enter your password.'); return false; }
    if (this.password.length < 6)       { this.popup('warn','Password Too Short','Password must be at least 6 characters.'); return false; }
    return true;
  }

  private validateRegister(): boolean {
    if (!this.name.trim())              { this.popup('warn','Name Required','Please enter your full name.'); return false; }
    if (this.name.trim().length < 2)    { this.popup('warn','Invalid Name','Name must be at least 2 characters.'); return false; }
    if (!this.email.trim())             { this.popup('warn','Email Required','Please enter your email address.'); return false; }
    if (!this.isValidEmail(this.email)) { this.popup('warn','Invalid Email','Enter a valid email e.g. user@example.com'); return false; }
    if (!this.password.trim())          { this.popup('warn','Password Required','Please create a password.'); return false; }
    if (this.password.length < 6)       { this.popup('warn','Weak Password','Password must be at least 6 characters.'); return false; }
    if (!/[A-Z]/.test(this.password))   { this.popup('warn','Weak Password','Must contain at least one uppercase letter (A–Z).'); return false; }
    if (!/[0-9]/.test(this.password))   { this.popup('warn','Weak Password','Must contain at least one number (0–9).'); return false; }
    return true;
  }

  handleSubmit() {
    if (this.isLogin) { if (!this.validateLogin())   return; }
    else              { if (!this.validateRegister()) return; }

    const authData = {
      name:     this.isLogin ? undefined : this.name.trim(),
      email:    this.email.trim(),
      password: this.password,
    };

    if (this.isLogin) {
      this.authService.login(authData).subscribe({
        next: (res: any) => {
          sessionStorage.setItem('token', res.token);
          sessionStorage.setItem('role',  res.role);
          sessionStorage.setItem('name',  res.name);
          this.closeOverlay.emit(); // ✅ close drawer
          this.popup('success', `Welcome, ${res.name || 'User'}! 👋`, 'Logged in successfully.', 1800)
            .then(() => {
              if (res.role === 'admin')        this.router.navigate(['/admin-dashboard']);
              else if (res.role === 'teacher') this.router.navigate(['/teacher']);
              else                             this.router.navigate(['/']);
            });
        },
        error: (err: any) => {
          const msg = (err.error?.message || '').toLowerCase();
          if (msg.includes('password'))
            this.popup('error','Wrong Password','The password you entered is incorrect.');
          else if (msg.includes('user') || msg.includes('not found') || msg.includes('email'))
            this.popup('error','Account Not Found','No account with this email. Please register first.');
          else
            this.popup('error','Login Failed', err.error?.message || 'Something went wrong.');
        }
      });
    } else {
      this.authService.register(authData).subscribe({
        next: () => {
          this.popup('success','Account Created! 🎉','Your account is ready. You can now log in.', 2000)
            .then(() => {
              this.isLogin = true;
              this.name = this.email = this.password = '';
            });
        },
        error: (err) => {
          const msg = (err.error?.message || '').toLowerCase();
          if (msg.includes('exist') || msg.includes('duplicate') || msg.includes('already'))
            this.popup('error','Email Already Registered','This email is in use. Please log in instead.');
          else
            this.popup('error','Registration Failed', err.error?.message || 'Something went wrong.');
        }
      });
    }
  }
}
// import { Component } from '@angular/core';
// import { AuthService } from '../../../services/auth.service';
// import { Router } from '@angular/router';

// @Component({
//   selector: 'app-login',
//   templateUrl: './login.component.html',
//   styleUrls: ['./login.component.css']
// })
// export class LoginComponent {
//   isLogin = true;
//   name = '';
//   email = '';
//   password = '';

//   // 1. Inject the Service and the Router
//   constructor(private authService: AuthService, private router: Router) {}

//   toggleMode() {
//     this.isLogin = !this.isLogin;
//   }

//   handleSubmit() {
//     // Prepare the data object
//     const authData = {
//       name: this.isLogin ? undefined : this.name,
//       email: this.email,
//       password: this.password
//     };

//     if (this.isLogin) {
//       // ✅ 2. Call Login and SUBSCRIBE
//       // Inside this.isLogin check
// // this.authService.login(authData).subscribe({
// //   next: (res: any) => {
// //     console.log('Login Success ✅', res);
    
// //     // 1. Save the token
// //     localStorage.setItem('token', res.token);

// //     // 2. Decode the token to see the role
// //     // JWT format is Header.Payload.Signature. We decode the [1] (Payload)
// //     const tokenPayload = JSON.parse(atob(res.token.split('.')[1]));
// //     const userRole = tokenPayload.role;

// //     alert(`Welcome back, ${tokenPayload.name || 'User'}!`);

// //     // 3. Conditional Redirection
// //     if (userRole === 'admin') {
// //       this.router.navigate(['/admin-dashboard']);
// //     } else if (userRole === 'teacher') {
// //       this.router.navigate(['/teacher-panel']);
// //     } else {
// //       this.router.navigate(['/']); // Standard Student Home
// //     }
// //   },
// //   error: (err) => {
// //     console.error('Login Failed ❌', err);
// //     alert(err.error?.message || 'Invalid Credentials');
// //   }
// // });
//     } else {
//       // ✅ 3. Call Register and SUBSCRIBE
//       this.authService.register(authData).subscribe({
//         next: (res) => {
//           console.log('Registration Success ✅', res);
//           alert('Account created! You can now login.');
//           this.isLogin = true; // Switch UI to login mode
//         },
//         error: (err) => {
//           console.error('Registration Failed ❌', err);
//           alert(err.error?.message || 'Registration Error');
//         }
//       });
//     }
//   }
// }





import { Component } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  isLogin = true;
  name = '';
  email = '';
  password = '';

  constructor(private authService: AuthService, private router: Router) {}

  toggleMode() {
    this.isLogin = !this.isLogin;
  }

  handleSubmit() {
    const authData = {
      name: this.isLogin ? undefined : this.name,
      email: this.email,
      password: this.password
    };

    if (this.isLogin) {

      // ✅ LOGIN FIXED (ONLY THIS PART WAS MISSING)
      this.authService.login(authData).subscribe({
        next: (res: any) => {
          console.log('Login Success ✅', res);

          // ✅ Save data
          sessionStorage.setItem('token', res.token);
          sessionStorage.setItem('role', res.role);
          sessionStorage.setItem('name', res.name);

          alert(`Welcome back, ${res.name || 'User'}!`);

          // ✅ Redirect based on role
          if (res.role === 'admin') {
            this.router.navigate(['/admin-dashboard']);
          } else if (res.role === 'teacher') {
            this.router.navigate(['/teacher-panel']);
          } else {
            this.router.navigate(['/']);
          }
        },
        error: (err: any) => {
          console.error('Login Failed ❌', err);
          alert(err.error?.message || 'Invalid Credentials');
        }
      });

    } else {

      // ✅ REGISTER (UNCHANGED)
      this.authService.register(authData).subscribe({
        next: (res) => {
          console.log('Registration Success ✅', res);
          alert('Account created! You can now login.');
          this.isLogin = true;
        },
        error: (err) => {
          console.error('Registration Failed ❌', err);
          alert(err.error?.message || 'Registration Error');
        }
      });

    }
  }
}
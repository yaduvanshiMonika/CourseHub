
import { Component, OnInit, Input } from '@angular/core';
import { Router } from '@angular/router';
import { ThemeService } from 'src/app/services/theme.service';

// import { Component, OnInit } from '@angular/core';
// import { Router } from '@angular/router';

// @Component({
//   selector: 'app-navbar',
//   templateUrl: './navbar.component.html',
//   styleUrls: ['./navbar.component.css']
// })
// export class NavbarComponent implements OnInit {

//   constructor(private router: Router) { }
// activeTab: string = 'home';
// userName: string = '';
// userRole: string = '';
// showDropdown: boolean = false;
// setActive(tab: string) {
//   this.activeTab = tab;
// }

// scrollToContact() {
//   this.activeTab = 'contact';

//   const section = document.getElementById('contact');
//   if (section) {
//     section.scrollIntoView({
//       behavior: 'smooth',
//       block: 'start'
//     });
//   }
// }
// isLoggedIn(): boolean {
//   return !!sessionStorage.getItem('token');
// }

// // logout() {
// //   sessionStorage.removeItem('token');
// //   sessionStorage.removeItem('role');
// //   sessionStorage.removeItem('name');
// //   alert('Logged out successfully');
// //   this.router.navigate(['/login']);
// // }

//   ngOnInit(): void {
//    this.userName = sessionStorage.getItem('name') || '';
//   this.userRole = sessionStorage.getItem('role') || '';
//   }


//   // ✅ Ye add karo ngOnInit ke neeche
//   ngDoCheck(): void {
//     this.userName = sessionStorage.getItem('name') || '';
//     this.userRole = sessionStorage.getItem('role') || '';
//   }

//   // ✅ Logout replace karo
//   logout() {
//     sessionStorage.clear();  // sab ek saath clear
//     alert('Logged out successfully');
//     this.router.navigate(['/login']);
//   }

//   toggleDropdown() {
//   this.showDropdown = !this.showDropdown;
// }

// goToAdmin() {
//   this.router.navigate(['/admin-dashboard']);
// }

// goToTeacher() {
//   this.router.navigate(['/teacher']);
// }

// }


import { NavigationEnd} from '@angular/router';
import { filter } from 'rxjs/operators';
import { HostListener } from '@angular/core';

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


  



  // ngOnInit(): void {
  //   this.loadUserData();

  //   this.router.events
  //     .pipe(filter(event => event instanceof NavigationEnd))
  //     .subscribe(() => {
  //       this.loadUserData();
  //     });
  // }

  loadUserData(): void {
    this.userName = sessionStorage.getItem('name') || '';
    this.userRole = sessionStorage.getItem('role') || '';
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

  // toggleDropdown() { this.showDropdown = !this.showDropdown; }
  // goToAdmin()   { this.router.navigate(['/admin-dashboard']); }
  // goToTeacher() { this.router.navigate(['/teacher']); }


 


  goToAdmin(): void {
    this.showDropdown = false;
    this.router.navigate(['/admin-dashboard']);
  }

  goToTeacher(): void {
    this.showDropdown = false;
    this.router.navigate(['/teacher']);
  }

  goToStudent(): void {
    this.showDropdown = false;
    this.router.navigate(['/student']);
  }
  @HostListener('document:click', ['$event'])
closeDropdown(event: any) {
  const clickedInside = event.target.closest('.profile');

  if (!clickedInside) {
    this.showDropdown = false;
  }
}
}


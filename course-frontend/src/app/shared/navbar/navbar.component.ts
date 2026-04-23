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

import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { HostListener } from '@angular/core';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {

  activeTab: string = 'home';
  userName: string = '';
  userRole: string = '';
  showDropdown: boolean = false;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.loadUserData();

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.loadUserData();
      });
  }

  loadUserData(): void {
    this.userName = sessionStorage.getItem('name') || '';
    this.userRole = sessionStorage.getItem('role') || '';
  }

  setActive(tab: string): void {
    this.activeTab = tab;
  }

  scrollToContact(): void {
    this.activeTab = 'contact';

    const section = document.getElementById('contact');
    if (section) {
      section.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }

  isLoggedIn(): boolean {
    return !!sessionStorage.getItem('token');
  }

  toggleDropdown(): void {
    this.showDropdown = !this.showDropdown;
  }

  logout(): void {
    this.showDropdown = false;
    sessionStorage.clear();
    alert('Logged out successfully');
    this.router.navigate(['/login']);
  }

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

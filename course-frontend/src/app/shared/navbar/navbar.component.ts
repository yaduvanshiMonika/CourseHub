import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {

  constructor() { }
 
activeTab: string = 'home';

setActive(tab: string) {
  this.activeTab = tab;
}

scrollToContact() {
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
  return !!localStorage.getItem('token');
}

logout() {
  localStorage.removeItem('token');
  alert('Logged out successfully');
  location.reload(); // simple refresh
}

  ngOnInit(): void {
  }

}

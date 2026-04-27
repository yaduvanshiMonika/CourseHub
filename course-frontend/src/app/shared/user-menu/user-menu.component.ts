import { Component, HostListener, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-user-menu',
  templateUrl: './user-menu.component.html',
  styleUrls: ['./user-menu.component.css']
})
export class UserMenuComponent implements OnInit {
  @Input() roleLabel: string = '';
  @Input() showBackToSite: boolean = true;
  @Input() showPanelLinks: boolean = false;
  @Input() afterLogoutRoute: string = '/login';

  menuOpen = false;
  userName = '';
  userRole = '';

  constructor(private router: Router, private auth: AuthService) {}

  ngOnInit(): void {
    this.syncFromSession();
  }

  toggle(): void {
    this.menuOpen = !this.menuOpen;
  }

  @HostListener('document:click', ['$event'])
  closeOnOutsideClick(event: any): void {
    if (!event?.target?.closest?.('.um-profile')) this.menuOpen = false;
  }

  private syncFromSession(): void {
    this.userName = this.auth.getName() || 'User';
    this.userRole = this.auth.getRole() || '';
  }

  get avatarLetter(): string {
    return (this.userName || 'U')[0].toUpperCase();
  }

  get displayRole(): string {
    if (this.roleLabel) return this.roleLabel;
    if (!this.userRole) return 'User';
    return this.userRole === 'admin' ? 'Super Admin' : this.userRole;
  }

  goToSupportMessages(): void {
    this.menuOpen = false;
    this.router.navigate(['/student/messages']);
  }

  goToSite(): void {
    this.menuOpen = false;
    this.router.navigate(['/']);
  }

  goToPanel(): void {
    this.menuOpen = false;
    if (this.userRole === 'admin') this.router.navigate(['/admin-dashboard']);
    else if (this.userRole === 'teacher') this.router.navigate(['/teacher']);
    else if (this.userRole === 'student') this.router.navigate(['/student']);
  }

  logout(): void {
    this.menuOpen = false;
    this.auth.logout();
    this.router.navigate([this.afterLogoutRoute]);
  }
}


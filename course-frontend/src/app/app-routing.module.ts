import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Fix: Direct paths because components are in the same /app folder
import { RoleGuard } from './guards/role.guard'; 
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { TeacherDashboardComponent } from './teacher-dashboard/teacher-dashboard.component';
// Find where your Login/Register actually sit and import them here:
import { LoginComponent } from './modules/public/login/login.component'; 

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { 
    path: 'admin-dashboard', 
    component: AdminDashboardComponent, 
    canActivate: [RoleGuard], 
    data: { expectedRoles: ['admin'] } 
  },
  { 
    path: 'teacher-panel', 
    component: TeacherDashboardComponent, 
    canActivate: [RoleGuard], 
    data: { expectedRoles: ['teacher'] } 
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule] // This MUST be here to fix the "no exported member" error
})
export class AppRoutingModule { }
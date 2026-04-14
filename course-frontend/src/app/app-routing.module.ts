import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Fix: Direct paths because components are in the same /app folder
import { RoleGuard } from './guards/role.guard'; 
import { CourseListComponent } from './modules/public/course-list/course-list.component';
import { CourseDetailComponent } from './modules/public/course-detail/course-detail.component';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';

// Find where your Login/Register actually sit and import them here:
import { LoginComponent } from './modules/public/login/login.component'; 
import { HomeComponent } from './modules/public/home/home.component';


const routes: Routes = [
  { path: 'login', component: LoginComponent },

  // ✅ PUBLIC ROUTES (ADD THESE)
 { path: '', component: HomeComponent },
  { path: 'home', component: HomeComponent },
  { path: 'courses', component: CourseListComponent },
  { path: 'course/:id', component: CourseDetailComponent },

  { 
    path: 'admin-dashboard', 
    component: AdminDashboardComponent, 
    canActivate: [RoleGuard], 
    data: { expectedRoles: ['admin'] } 
  },

{
  path: 'teacher',
  loadChildren: () =>
    import('./teacher/teacher.module').then(m => m.TeacherModule),
  canActivate: [RoleGuard],
  data: { expectedRoles: ['teacher'] }
},
  { path: '**', redirectTo: '' }

  
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    anchorScrolling: 'enabled', // 👈 This is the magic line
    scrollPositionRestoration: 'enabled' // 👈 This makes sure you don't stay at the bottom
  })],
  exports: [RouterModule] // This MUST be here to fix the "no exported member" error
})
export class AppRoutingModule { }
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { CourseListComponent } from './course-list/course-list.component';
import { CourseDetailComponent } from './course-detail/course-detail.component';

const routes: Routes = [
  { path: '', component: HomeComponent },          // homepage
  { path: 'login', component: LoginComponent },    // login page
  { path: 'courses', component: CourseListComponent },  // course list
  { path: 'courses/:id', component: CourseDetailComponent } // course detail
  { 
  path: 'teacher-panel', 
  component: TeacherDashboardComponent, 
  canActivate: [RoleGuard], 
  data: { expectedRoles: ['teacher'] } 
}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PublicRoutingModule { }
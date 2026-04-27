// import { NgModule } from '@angular/core';
// import { RouterModule, Routes } from '@angular/router';

// import { StudentDashboardComponent } from './pages/student-dashboard/student-dashboard.component';
// import { StudentCoursesComponent } from './pages/student-courses/student-courses.component';
// import { LearningPageComponent } from './pages/learning-page/learning-page.component';
// import { StudentProfileComponent } from './pages/student-profile/student-profile.component';
// import { StudentCertificatesComponent } from './pages/student-certificates/student-certificates.component';
// import { RoleGuard } from '../guards/role.guard';

// const routes: Routes = [
//   {
//     path: '',
//     redirectTo: 'student-dashboard',
//     pathMatch: 'full'
//   },
//   {
//     path: 'student-dashboard',
//     component: StudentDashboardComponent,
//     canActivate: [RoleGuard],
//     data: { expectedRoles: ['student'] }
//   },
//   {
//     path: 'student-courses',
//     component: StudentCoursesComponent,
//     canActivate: [RoleGuard],
//     data: { expectedRoles: ['student'] }
//   },
//   {
//     path: 'course/:id/learn',
//     component: LearningPageComponent,
//     canActivate: [RoleGuard],
//     data: { expectedRoles: ['student'] }
//   },
//   {
//     path: 'profile',
//     component: StudentProfileComponent,
//     canActivate: [RoleGuard],
//     data: { expectedRoles: ['student'] }
//   },
//   {
//     path: 'certificates',
//     component: StudentCertificatesComponent,
//     canActivate: [RoleGuard],
//     data: { expectedRoles: ['student'] }
//   }
// ];

// @NgModule({
//   imports: [RouterModule.forChild(routes)],
//   exports: [RouterModule]
// })
// export class StudentRoutingModule { }









import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { StudentLayoutComponent } from './student-layout/student-layout.component';

import { StudentDashboardComponent } from './pages/student-dashboard/student-dashboard.component';
import { StudentCoursesComponent } from './pages/student-courses/student-courses.component';
import { LearningPageComponent } from './pages/learning-page/learning-page.component';
import { StudentProfileComponent } from './pages/student-profile/student-profile.component';
import { StudentCertificatesComponent } from './pages/student-certificates/student-certificates.component';
import { StudentMessagesComponent } from './pages/student-messages/student-messages.component';

import { RoleGuard } from '../guards/role.guard';

const routes: Routes = [
  {
    path: '',
    component: StudentLayoutComponent,
    canActivate: [RoleGuard],
    data: { expectedRoles: ['student'] },
    children: [
      { path: '', redirectTo: 'student-dashboard', pathMatch: 'full' },

      { path: 'student-dashboard', component: StudentDashboardComponent },
      { path: 'student-courses', component: StudentCoursesComponent },
      { path: 'course/:id/learn', component: LearningPageComponent },
      { path: 'profile', component: StudentProfileComponent },
      { path: 'certificates', component: StudentCertificatesComponent },
      { path: 'messages', component: StudentMessagesComponent }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class StudentRoutingModule {}
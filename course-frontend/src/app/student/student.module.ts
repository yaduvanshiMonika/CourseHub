import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { StudentRoutingModule } from './student-routing.module';
import { SharedModule } from '../shared/shared.module';

import { StudentDashboardComponent } from './pages/student-dashboard/student-dashboard.component';
import { StudentCoursesComponent } from './pages/student-courses/student-courses.component';
import { LearningPageComponent } from './pages/learning-page/learning-page.component';
import { StudentProfileComponent } from './pages/student-profile/student-profile.component';
import { StudentCertificatesComponent } from './pages/student-certificates/student-certificates.component';
import { StudentLayoutComponent } from './student-layout/student-layout.component';
import { StudentMessagesComponent } from './pages/student-messages/student-messages.component';


@NgModule({
  declarations: [
    StudentDashboardComponent,
    StudentCoursesComponent,
    LearningPageComponent,
    StudentProfileComponent,
    StudentCertificatesComponent,
    StudentLayoutComponent,
    StudentMessagesComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    StudentRoutingModule,
    SharedModule
  ]
})
export class StudentModule { }
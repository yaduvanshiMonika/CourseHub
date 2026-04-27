import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { TeacherRoutingModule } from './teacher-routing.module';
import { SharedModule } from '../shared/shared.module';

import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { AddCourseComponent } from './pages/add-course/add-course.component';
import { MyCoursesComponent } from './pages/my-courses/my-courses.component';
import { CourseContentsComponent } from './pages/course-contents/course-contents.component';
import { EnrollmentsComponent } from './pages/enrollments/enrollments.component';

@NgModule({
  declarations: [
    DashboardComponent,
    AddCourseComponent,
    MyCoursesComponent,
    CourseContentsComponent,
    EnrollmentsComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    TeacherRoutingModule,
    SharedModule
  ]
})
export class TeacherModule { }

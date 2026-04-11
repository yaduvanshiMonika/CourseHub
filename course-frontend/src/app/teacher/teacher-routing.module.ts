import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { AddCourseComponent } from './pages/add-course/add-course.component';
import { MyCoursesComponent } from './pages/my-courses/my-courses.component';
import { CourseContentsComponent } from './pages/course-contents/course-contents.component';
import { EnrollmentsComponent } from './pages/enrollments/enrollments.component';

const routes: Routes = [
  {
    path: '',
    component: DashboardComponent,
    children: [
      { path: 'add-course', component: AddCourseComponent },
      { path: 'my-courses', component: MyCoursesComponent },
      { path: 'contents/:id', component: CourseContentsComponent },
      { path: 'enrollments/:id', component: EnrollmentsComponent },
      { path: '', redirectTo: 'add-course', pathMatch: 'full' }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TeacherRoutingModule { }

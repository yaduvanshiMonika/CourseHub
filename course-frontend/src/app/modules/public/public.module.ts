import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// ✅ IMPORT YOUR COMPONENTS
import { LoginComponent } from './login/login.component';
import { CourseListComponent } from './course-list/course-list.component';
import { CourseDetailComponent } from './course-detail/course-detail.component';
import { HomeComponent } from './home/home.component';

@NgModule({
  declarations: [
    LoginComponent,

    // ✅ ADD THESE (VERY IMPORTANT)
    CourseListComponent,
    CourseDetailComponent,
    HomeComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule   // ✅ already correct
  ],
    exports: [
    LoginComponent  // ← add this line
  ]
})
export class PublicModule { }
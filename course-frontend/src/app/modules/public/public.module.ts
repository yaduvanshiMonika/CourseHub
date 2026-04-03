import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // 1. Import this
import { LoginComponent } from './login/login.component';
// ... other imports

@NgModule({
  declarations: [
    LoginComponent,
    // ... other public components
  ],
  imports: [
    CommonModule,
    FormsModule // 2. Add this to imports
  ]
})
export class PublicModule { }
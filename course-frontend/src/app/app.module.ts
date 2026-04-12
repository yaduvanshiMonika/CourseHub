import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms'; 
import { HttpClientModule } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { SafePipe } from './safe.pipe';
// Add this import line
import { PublicModule } from './modules/public/public.module'; 

import { AppComponent } from './app.component';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { TeacherDashboardComponent } from './teacher-dashboard/teacher-dashboard.component';
import { NavbarComponent } from './shared/navbar/navbar.component'; 
import { RouterModule } from '@angular/router';
import { ReceiptComponent } from './receipt/receipt.component';
@NgModule({
  declarations: [
    AppComponent,
    AdminDashboardComponent,
    TeacherDashboardComponent,
    NavbarComponent,
    ReceiptComponent,
      SafePipe
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,       
    HttpClientModule,
    PublicModule, // <--- ADD THIS HERE
        RouterModule  
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
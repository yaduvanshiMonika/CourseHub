// import { NgModule } from '@angular/core';
// import { BrowserModule } from '@angular/platform-browser';
// import { FormsModule , ReactiveFormsModule} from '@angular/forms'; 
// import { HttpClientModule } from '@angular/common/http';
// import { AppRoutingModule } from './app-routing.module';
// import { SafePipe } from './safe.pipe';
// // Add this import line
// import { PublicModule } from './modules/public/public.module'; 

// import { AppComponent } from './app.component';
// import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
// import { DashboardComponent } from './teacher/pages/dashboard/dashboard.component';
// import { NavbarComponent } from './shared/navbar/navbar.component'; 
// import { RouterModule } from '@angular/router';
// import { ReceiptComponent } from './receipt/receipt.component';
// @NgModule({
//   declarations: [
//     AppComponent,
//     AdminDashboardComponent,
//     ReceiptComponent
//     // SafePipe,
  
   
//     NavbarComponent,
     
//  ],
//   imports: [
//     BrowserModule,
//     AppRoutingModule,
//     FormsModule,       
//     HttpClientModule,
//     PublicModule, // <--- ADD THIS HERE
//         RouterModule,

//         ReactiveFormsModule
//   ],
//   providers: [],
//   bootstrap: [AppComponent]
// })
// export class AppModule { }


import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';

import { AppRoutingModule } from './app-routing.module';
import { PublicModule } from './modules/public/public.module';
import { SharedModule } from './shared/shared.module';

import { AppComponent } from './app.component';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { NavbarComponent } from './shared/navbar/navbar.component';
import { ReceiptComponent } from './receipt/receipt.component';

@NgModule({
  declarations: [
    AppComponent,
    AdminDashboardComponent,
    ReceiptComponent,
    NavbarComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,

    PublicModule, // <--- ADD THIS HERE
        RouterModule,
         SharedModule

  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
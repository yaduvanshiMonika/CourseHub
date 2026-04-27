import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SafePipe } from '../safe.pipe';
import { UserMenuComponent } from './user-menu/user-menu.component';


@NgModule({
  declarations: [
    SafePipe,
    UserMenuComponent
  ],
  imports: [
    CommonModule
  ],
  exports: [
  SafePipe,
  UserMenuComponent,
  CommonModule   
]
})
export class SharedModule { }

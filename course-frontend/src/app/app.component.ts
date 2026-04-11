import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'course-frontend';

  //add monika
  isLoggedIn: boolean =false;
  ngDoCheck(): void {
    this.isLoggedIn = !!localStorage.getItem('token');
  }

}

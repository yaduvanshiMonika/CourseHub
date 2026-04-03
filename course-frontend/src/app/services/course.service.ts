import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CourseService {

  courses = [
    {
      id: 1,
      title: 'Angular for Beginners',
      instructor: 'John Doe',
      image: 'https://picsum.photos/400/200',
      description: 'Learn Angular step by step',
      price: 499
    },
    {
      id: 2,
      title: 'Node.js Mastery',
      instructor: 'Jane Smith',
      image: 'https://picsum.photos/400/201',
      description: 'Master backend development',
      price: 599
    },
    {
      id: 3,
      title: 'Full Stack Web Dev',
      instructor: 'Alex Ray',
      image: 'https://picsum.photos/400/202',
      description: 'Frontend + Backend complete',
      price: 799
    }
  ];

  getCourses() {
    return this.courses;
  }

  getCourseById(id: number) {
    return this.courses.find(c => c.id === id);
  }
}
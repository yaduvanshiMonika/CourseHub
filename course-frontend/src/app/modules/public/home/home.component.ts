import { Component, ViewChild, ElementRef } from '@angular/core';
import { CourseService } from 'src/app/services/course.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html', 
  styleUrls: ['./home.component.css']
})
export class HomeComponent {

  courses: any[] = [];

  // 🔥 Typing animation
  typedCode: string = '';

  fullCode: string = `class CourseHub {
  constructor(user) {
    this.user = user;
    this.courses = [];
  }

  fetchCourses() {
    return [
      { id: 1, title: "Angular Mastery" },
      { id: 2, title: "Node.js Backend" },
      { id: 3, title: "MySQL Database" }
    ];
  }

  enroll(courseId) {
    const course = this.fetchCourses().find(c => c.id === courseId);

    if (course) {
      this.courses.push(course);
      console.log(this.user + " enrolled in " + course.title);
    } else {
      console.log("Course not found");
    }
  }

  startLearning() {
    console.log("🚀 Welcome to CourseHub");
    this.enroll(1);
  }
}

const student = new CourseHub("Developer");
student.startLearning();`;

  isDeleting: boolean = false;

  // 🔥 CODE AUTO SCROLL
  @ViewChild('codeContainer') codeContainer!: ElementRef;

  // 🔥 TESTIMONIAL AUTO SCROLL
  @ViewChild('scrollContainer') scrollContainer!: ElementRef;

  constructor(private courseService: CourseService) {}

  ngOnInit() {
    this.courses = this.courseService.getCourses();

    this.startTypingLoop();

    // 🔥 start testimonial auto scroll AFTER DOM loads
    setTimeout(() => {
      this.startAutoScroll();
    }, 1000);
  }

  // 🔥 LOOP TYPING + AUTO SCROLL
  startTypingLoop() {
    let i = 0;

    const type = () => {
      if (!this.isDeleting) {
        this.typedCode = this.fullCode.substring(0, i++);
        this.scrollToBottom();

        if (i > this.fullCode.length) {
          this.isDeleting = true;
          setTimeout(type, 1000);
          return;
        }
      } else {
        this.typedCode = this.fullCode.substring(0, i--);
        this.scrollToBottom();

        if (i < 0) {
          this.isDeleting = false;
          i = 0;
        }
      }

      setTimeout(type, this.isDeleting ? 20 : 40);
    };

    type();
  }

  // 🔥 CODE AUTO SCROLL FUNCTION
  scrollToBottom() {
    try {
      setTimeout(() => {
        const el = this.codeContainer.nativeElement;
        el.scrollTop = el.scrollHeight;
      }, 0);
    } catch (err) {}
  }

  // 🔥 TESTIMONIAL AUTO SCROLL FUNCTION
  startAutoScroll() {
    setInterval(() => {
      const el = this.scrollContainer.nativeElement;

      el.scrollLeft += 6;

      // 🔁 reset when end reached
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth) {
        el.scrollLeft = 0;
      }
    }, 10);
  }

  // 🔥 Mouse tilt effect
  onMouseMove(event: MouseEvent) {
    const card = event.currentTarget as HTMLElement;
    const rect = card.getBoundingClientRect();

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = -(y - centerY) / 25;
    const rotateY = (x - centerX) / 25;

    card.style.transform = `
      rotateX(${rotateX}deg)
      rotateY(${rotateY}deg)
      scale(1.05)
    `;
  }

  // 🔥 Reset tilt
  resetTilt(event: MouseEvent) {
    const card = event.currentTarget as HTMLElement;
    card.style.transform = 'rotateX(0deg) rotateY(0deg) scale(1)';
  }
  quantities: number[] = [0, 0, 0];

addToCart(index: number) {
  this.quantities[index] = 1;
}

increaseQty(index: number) {
  this.quantities[index]++;
}

decreaseQty(index: number) {
  if (this.quantities[index] > 1) {
    this.quantities[index]--;
  } else {
    this.quantities[index] = 0;
  }
}
onSubmit() {
  console.log("Form submitted");
}

}

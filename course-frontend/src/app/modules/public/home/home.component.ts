import { Component, ViewChild, ElementRef, OnInit } from '@angular/core';
import { CourseService } from 'src/app/services/course.service';
import { AuthService } from '../../../services/auth.service';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html', 
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

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

  constructor(
  private courseService: CourseService,
  public authService: AuthService,
  private router: Router,
  private http: HttpClient
) {}

  ngOnInit() {

    // Prefill contact email when logged in (must match account for "Messages" in student panel)
    const accEmail = this.authService.getEmail();
    if (accEmail) {
      this.contact.email = accEmail;
    }

    // ✅ FIX: Handle Observable properly
    this.courseService.getCourses().subscribe({
      next: (data) => {
        this.courses = data;
      },
      error: (err) => console.error(err)
    });

    this.startTypingLoop();

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
    if (!this.codeContainer) return; // ✅ FIX

    setTimeout(() => {
      const el = this.codeContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
    }, 0);
  }

  // 🔥 TESTIMONIAL AUTO SCROLL FUNCTION
  startAutoScroll() {
    if (!this.scrollContainer) return; // ✅ FIX

    setInterval(() => {
      const el = this.scrollContainer.nativeElement;

      el.scrollLeft += 6;

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
  // ✅ Navigate to Admin Panel
goToAdmin() {
  this.router.navigate(['/admin-dashboard']);
}

// ✅ Navigate to Teacher Panel
goToTeacher() {
  this.router.navigate(['/teacher-panel']);
}


contact = {
  name: '',
  email: '',
  phone: '',
  subject: '',
  message: ''
};

submitContact() {
  const accEmail = this.authService.getEmail();
  if (this.authService.getToken() && accEmail) {
    this.contact.email = accEmail;
  }
  const token = this.authService.getToken();
  const headers = token
    ? new HttpHeaders({ Authorization: `Bearer ${token}` })
    : undefined;

  this.http
    .post('https://coursehub-production-b7b9.up.railway.app/api/contacts', this.contact, { headers })
    .subscribe({
      next: () => {
        alert("Message sent successfully ✅");
        this.contact = {
          name: '',
          email: accEmail || '',
          phone: '',
          subject: '',
          message: ''
        };
      },
      error: (err) => {
        const msg = err?.error?.message || err?.message || "Could not send message. Please try again.";
        alert(msg);
      }
    });
}
// ─────────────────────────────────────────────────────────
//  ADD these properties and methods to HomeComponent class
//  (home.component.ts)
// ─────────────────────────────────────────────────────────

// ── WEBINAR FORM STATE ────────────────────────────────────
webinarForm = {
  orgName:     '',
  orgType:     '',
  contactName: '',
  email:       '',
  phone:       '',
  attendees:   '',
  date:        '',
  mode:        '',
  topic:       '',
  message:     ''
};

isSubmittingWebinar = false;

// ── SELECT TOPIC FROM CARD ────────────────────────────────
selectTopic(topic: string) {
  this.webinarForm.topic = topic;
  // Scroll to form smoothly
  setTimeout(() => {
    const form = document.querySelector('.webinar-form-wrap');
    if (form) form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);
}

// ── SUBMIT WEBINAR REQUEST ────────────────────────────────

submitWebinar() {
  const payload = {
    org_name:       this.webinarForm.orgName,
    org_type:       this.webinarForm.orgType,
    contact_name:   this.webinarForm.contactName,
    email:          this.webinarForm.email,
    phone:          this.webinarForm.phone,
    attendees:      this.webinarForm.attendees,
    preferred_date: this.webinarForm.date,
    mode:           this.webinarForm.mode,
    topic:          this.webinarForm.topic,
    message:        this.webinarForm.message
  };

  this.isSubmittingWebinar = true;
  this.http.post('https://coursehub-production-b7b9.up.railway.app/api/webinar', payload).subscribe({
    next: () => {
      this.isSubmittingWebinar = false;
      alert('✅ Request sent! We will contact you within 24 hours.');
      this.webinarForm = { orgName:'', orgType:'', contactName:'', email:'', phone:'', attendees:'', date:'', mode:'', topic:'', message:'' };
    },
    error: () => { this.isSubmittingWebinar = false; alert('❌ Failed. Please try again.'); }
  });
}
}
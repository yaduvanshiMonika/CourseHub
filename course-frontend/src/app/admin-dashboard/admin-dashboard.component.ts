import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AdminService } from '../services/admin.service';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {

  showModal: boolean = false;
  isCollapsed: boolean = false;

  activeTab: 'courses' | 'videos' | 'tutorials' | 'users' | 'deleted-students' | 'teachers' | 'payments' = 'courses';

  allData: any[] = [];
  selectedFile: File | null = null;

  teachersList: any[] = [];

  formData = {
    id: null,
    fullName: '',
    email: '',
    expertise: '',
    title: '',
    category: 'Development',
    instructor: '',
    user: '',
    course: '',
    amount: '',
    status: 'pending'
  };
  

  displayStats = { students: 0, teachers: 0, courses: 0 };
  targetStats = { students: 0, teachers: 0, courses: 0 };

  constructor(private router: Router, private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadData();
    this.loadTeachers();
    this.loadCourses();
    this.setTab('courses');
  }

  // ✅ TEACHERS
 loadTeachers() {
  this.adminService.getTeachers().subscribe({
    next: (data: any[]) => {
      console.log("Teachers API:", data);

      this.teachersList = data.map(t => ({
        id: t.id,
        name: t.name
      }));
    },
    error: (err) => {
      console.error("Error loading teachers", err);
    }
  });
}
  // ✅ DATA
  loadData(): void {
    this.adminService.getDataByTable(this.activeTab).subscribe({
      next: (data: any[]) => {

        if (this.activeTab === 'courses') {
          this.allData = data.map(c => ({
            ...c,
            title: c.title || '',
            category: c.category || '',
            instructor: c.instructor || ''
          }));
        } else {
          this.allData = data;
        }

        if (this.activeTab === 'teachers') this.targetStats.teachers = data.length;
        if (this.activeTab === 'courses') this.targetStats.courses = data.length;
        if (this.activeTab === 'users') this.targetStats.students = data.length;

        this.animateNumbers();
      },
      error: (err: any) => console.error(`Error loading ${this.activeTab}:`, err)
    });
  }

  setTab(tab: any): void {
    this.activeTab = tab;
    this.loadData();
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];

    if (file && file.type === 'application/pdf') {
      this.selectedFile = file;
    } else if (file) {
      alert('Please select a valid PDF file.');
      this.selectedFile = null;
    }
  }
  

  // 🔥🔥🔥 MAIN FIX HERE
  onSave(): void {

  // =====================
  // 👩‍🏫 TEACHERS
  // =====================
  if (this.activeTab === 'teachers') {

    // ✅ VALIDATION
if (
  !this.formData.fullName ||
  !this.formData.email ||
  !this.formData.expertise ||
  this.formData.expertise.trim() === ''
) {
  alert('Name, Email and Expertise are required ❌');
  return;
}
  const teacherPayload = {
  id: this.formData.id,
  name: this.formData.fullName,   // 🔥 CRITICAL FIX
  email: this.formData.email,
  expertise: this.formData.expertise
};

    // 🔥 EDIT MODE
    if (this.formData.id) {
      this.adminService.updateTeacher(teacherPayload).subscribe({
        next: () => this.handleSuccess('Teacher Updated'),
        error: (err: any) => alert('Update failed: ' + err.message)
      });
    }

    // 🔥 ADD MODE
    else {
      this.adminService.saveTeacher(teacherPayload).subscribe({
        next: () => this.handleSuccess('Teacher Added'),
        error: (err: any) => alert('Save failed: ' + err.message)
      });
    }
  }

  // =====================
  // 📚 COURSES
  // =====================
  else if (this.activeTab === 'courses') {

    if (!this.formData.title || !this.formData.category || !this.formData.instructor) {
      alert("All course fields required ❌");
      return;
    }

    // EDIT
    if (this.formData.id) {
      this.adminService.updateCourse({
        id: this.formData.id,
        title: this.formData.title,
        category: this.formData.category,
        instructor: this.formData.instructor
      }).subscribe({
        next: () => this.handleSuccess('Course Updated'),
        error: (err: any) => alert('Update failed: ' + err.message)
      });
    }

    // ADD
    else {
      this.adminService.uploadCourse(
        this.formData.title,
        this.formData.category,
        this.formData.instructor,
        this.selectedFile
      ).subscribe({
        next: () => this.handleSuccess('Course Added'),
        error: (err: any) => alert('Save failed: ' + err.message)
      });
    }
  }

  // =====================
  // 💳 PAYMENTS
  // =====================
  else if (this.activeTab === 'payments') {

    if (!this.formData.user || !this.formData.course || !this.formData.amount) {
      alert('All payment fields required ❌');
      return;
    }

    const paymentPayload = {
      user: this.formData.user,
      course: this.formData.course,
      amount: this.formData.amount,
      status: this.formData.status
    };

    this.adminService.savePayment(paymentPayload).subscribe({
      next: () => this.handleSuccess('Payment'),
      error: (err: any) => alert('Payment failed: ' + err.message)
    });
  }
}
  private handleSuccess(type: string): void {
    alert(`${type} successfully ✅`);
    this.closeModal();
    this.loadData();
    this.resetForm();
  }

  

  restoreStudent(id: number): void {
    if (confirm('Restore this record?')) {
      this.adminService.restoreUser(id).subscribe({
        next: () => this.loadData(),
        error: (err: any) => alert('Restore failed: ' + err.message)
      });
    }
  }

  // ✅ EDIT (important)
  editItem(item: any): void {
    this.formData = {
      id: item.id, // 🔥 THIS IS KEY
      fullName: item.name || '',
      email: item.email || '',
      expertise: item.expertise || '',
      title: item.title || '',
      category: item.category || 'Development',
      instructor: item.instructor || '',
      user: item.user || '',
      course: item.course || '',
      amount: item.amount || '',
      status: item.status || 'pending'
    };

    this.showModal = true;
  }

  openAddModal() {
    this.resetForm();
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.resetForm();
  }

  resetForm() {
    this.formData = {
      id: null,
      fullName: '',
      email: '',
      expertise: '',
      title: '',
      category: 'Development',
      instructor: '',
      user: '',
      course: '',
      amount: '',
      status: 'pending'
    };
    this.selectedFile = null;
  }

  logout(): void {
    localStorage.clear();
    this.router.navigate(['/login']);
  }
  coursesList: any[] = [];
courseContents: any[] = [];
selectedCourseId: number | null = null;
loadCourses() {
  this.adminService.getDataByTable('courses').subscribe({
    next: (data: any[]) => this.coursesList = data,
    error: err => console.error(err)
  });
}

  animateNumbers(): void {
    const duration = 1500;
    const steps = 50;
    const interval = duration / steps;

    const timer = setInterval(() => {
      let completed = true;

      const keys = ['students', 'teachers', 'courses'] as const;

      for (const key of keys) {
        if (this.displayStats[key] < this.targetStats[key]) {
          const increment = Math.ceil(this.targetStats[key] / steps);
          this.displayStats[key] = Math.min(
            this.displayStats[key] + increment,
            this.targetStats[key]
          );
          completed = false;
        }
      }

      if (completed) clearInterval(timer);
    }, interval);
    
  }
onCourseSelect(event: any) {
 const courseId = Number(event.target.value);
  this.selectedCourseId = courseId;

  if (!courseId) return;

  this.adminService.getCourseContent(courseId).subscribe({
   next: (res: any[]) => {
      console.log("CONTENT:", res); // 👈 DEBUG
      this.courseContents = res;
    },
    error: (err) => {
      console.error(err);
      alert('Failed to load content');
    }
  });
}

deleteItem(id: number): void {

  if (!confirm('Delete this teacher?')) return;

  this.adminService.deleteContent('teachers', id).subscribe({
    next: () => {
      this.allData = this.allData.filter(item => item.id !== id);
    },
    error: (err) => {
      console.error("DELETE ERROR:", err);
      alert('Delete failed ❌');
    }
  });
}

}
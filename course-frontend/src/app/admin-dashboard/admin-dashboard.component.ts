import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AdminService } from '../services/admin.service';
import { HostListener } from '@angular/core';
@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {

  showModal: boolean = false;
  isCollapsed: boolean = false;
  userName: string = '';
userRole: string = '';

  activeTab: 'courses' | 'videos' | 'tutorials' | 'users' | 'deleted-students' | 'teachers' | 'payments' = 'courses';

  allData: any[] = [];
  selectedFile: File | null = null;

  teachersList: any[] = [];
  searchTerm: string = '';
filteredData: any[] = [];
showDropdown: boolean = false;

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
    status: 'published'
  };
  

  displayStats = { students: 0, teachers: 0, courses: 0 };
  targetStats = { students: 0, teachers: 0, courses: 0 };

  constructor(private router: Router, private adminService: AdminService) {
    
  }
  toggleDropdown() {
  this.showDropdown = !this.showDropdown;
}

  ngOnInit(): void {
    this.loadData();
    this.loadTeachers();
    this.loadCourses();
     this.loadStats();  
    this.setTab('courses');
    this.userName = sessionStorage.getItem('name') || 'Admin';
this.userRole = sessionStorage.getItem('role') || 'admin';
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
      if (this.activeTab === 'payments') {

    this.adminService.getPayments().subscribe({
      next: (data: any[]) => {
        console.log("PAYMENTS DATA:", data); // 🔥 DEBUG

        this.allData = data;
        this.filteredData = [...data];
      },
      error: (err: any) => console.error('Payments error:', err)
    });

    return; // 🔥 IMPORTANT (stop further execution)
  }

 
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
  this.filteredData = [...this.allData];
        if (this.activeTab === 'teachers') this.targetStats.teachers = data.length;
        if (this.activeTab === 'courses') this.targetStats.courses = data.length;
        if (this.activeTab === 'users') this.targetStats.students = data.length;

        this.animateNumbers();
      },
      error: (err: any) => console.error(`Error loading ${this.activeTab}:`, err)
    });
  }
setTab(tab: any): void {
  console.log("👉 TAB CLICKED:", tab);        // 🔥 ADD THIS
  this.activeTab = tab;
  console.log("👉 ACTIVE TAB SET:", this.activeTab); // 🔥 ADD THIS
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
  applyFilter(): void {
  const term = this.searchTerm.toLowerCase().trim();

  if (!term) {
    this.filteredData = [...this.allData];
    return;
  }

  if (this.activeTab === 'users') {
    this.filteredData = this.allData.filter(item =>
      item.name?.toLowerCase().includes(term) ||
      item.email?.toLowerCase().includes(term)
    );
  }

  else if (this.activeTab === 'teachers') {
    this.filteredData = this.allData.filter(item =>
      item.name?.toLowerCase().includes(term) ||
      item.email?.toLowerCase().includes(term) ||
      item.expertise?.toLowerCase().includes(term)
    );
  }

  else if (this.activeTab === 'courses') {
    this.filteredData = this.allData.filter(item =>
      item.title?.toLowerCase().includes(term) ||
      item.category?.toLowerCase().includes(term) ||
      item.instructor?.toLowerCase().includes(term)
    );
  }

  else {
    this.filteredData = [...this.allData];
  }
}
  

  // 🔥🔥🔥 MAIN FIX HERE
 onSave(): void {
  // =====================
  // 👩‍🏫 TEACHERS
  // =====================
  if (this.activeTab === 'teachers') {
    if (!this.formData.fullName || !this.formData.email || !this.formData.expertise) {
      alert('Name, Email and Expertise are required ❌');
      return;
    }

    const teacherPayload = {
      id: this.formData.id,
      name: this.formData.fullName, // Maps to 'name' in backend
      email: this.formData.email,
      expertise: this.formData.expertise
    };

    if (this.formData.id) {
      this.adminService.updateTeacher(teacherPayload).subscribe({
        next: () => this.handleSuccess('Teacher Updated'),
        error: (err: any) => alert('Update failed: ' + err.message)
      });
    } else {
      this.adminService.saveTeacher(teacherPayload).subscribe({
        next: () => this.handleSuccess('Teacher Added'),
        error: (err: any) => alert('Save failed: ' + err.message)
      });
    }
  }

  // =====================
  // 👨‍🎓 STUDENTS (The missing piece!)
 // Inside onSave() in admin-dashboard.component.ts
else if (this.activeTab === 'users') {
  if (!this.formData.fullName || !this.formData.email) {
    alert('Name and Email are required ❌');
    return;
  }

  const studentPayload = {
    id: this.formData.id, // Must include ID for update check
    name: this.formData.fullName,
    email: this.formData.email,
    role: 'student'
  };

  if (this.formData.id) {
    // EDIT MODE: Use updateTeacher logic which targets the users table
    this.adminService.updateStudent(studentPayload).subscribe({ 
      next: () => this.handleSuccess('Student Updated'),
      error: (err: any) => alert('Update failed: ' + err.message)
    });
  } else {
    // ADD MODE: Create new student
    this.adminService.saveStudent(studentPayload).subscribe({
      next: () => this.handleSuccess('Student Added'),
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

    if (this.formData.id) {
      this.adminService.updateCourse({
        id: this.formData.id,
        title: this.formData.title,
        category: this.formData.category,
        instructor: this.formData.instructor,
        status: this.formData.status
      }).subscribe({
        next: () => this.handleSuccess('Course Updated'),
        error: (err: any) => alert('Update failed: ' + err.message)
      });
    } else {
      this.adminService.uploadCourse(
        this.formData.title,
        this.formData.category,
        this.formData.instructor,
         this.selectedFile,
  this.formData.status  
      ).subscribe({
        next: () => this.handleSuccess('Course Added'),
        error: (err: any) => alert('Save failed: ' + err.message)
      });
    }
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
      status: item.status || 'published'
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
      status: 'published'
    };
    this.selectedFile = null;
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

// ✅ Updated deleteItem in admin-dashboard.component.ts
deleteItem(id: number): void {
  if (!confirm('Are you sure you want to delete this record?')) return;

  let table = '';

  // Map the active tab to the correct backend endpoint
  if (this.activeTab === 'users' || this.activeTab === 'deleted-students') {
    table = 'users'; // Matches your backend router.delete('/users/:id')
  } else if (this.activeTab === 'teachers') {
    table = 'teachers';
  } else if (this.activeTab === 'courses') {
    table = 'courses';
  } else if (this.activeTab === 'videos') {
    table = 'course-content';
  }

  // Ensure 'table' was set correctly before calling service
  if (!table) {
    alert('Error: Unknown table for deletion');
    return;
  }

  this.adminService.deleteContent(table, id).subscribe({
    next: () => {
      
      alert('Deleted successfully ✅');
      

  // ✅ Reload everything (BEST WAY)
  this.loadData();
  this.loadStats();

    },
    error: (err) => {
      console.error("DELETE ERROR:", err);
      // 401 Error usually means you need to re-login
      const errorMsg = err.status === 401 ? 'Unauthorized - Please re-login' : 'Delete failed ❌';
      alert(errorMsg);
    }
  });
}
loadStats(): void {
  this.adminService.getDataByTable('users').subscribe(data => {
    this.targetStats.students = data.length;
    this.animateNumbers();
  });

  this.adminService.getDataByTable('teachers').subscribe(data => {
    this.targetStats.teachers = data.length;
    this.animateNumbers();
  });

  this.adminService.getDataByTable('courses').subscribe(data => {
    this.targetStats.courses = data.length;
    this.animateNumbers();
  });
}



@HostListener('document:click', ['$event'])
onClickOutside(event: any) {
  const clickedInside = event.target.closest('.profile');
  if (!clickedInside) {
    this.showDropdown = false;
  }
}
goToWebsite() {
  this.showDropdown = false;
  this.router.navigate(['/']);
}

logout(): void {
  this.showDropdown = false;
  sessionStorage.clear();
  this.router.navigate(['/login']);
}
}
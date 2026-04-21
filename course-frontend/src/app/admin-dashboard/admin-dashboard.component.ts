import { Component, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AdminService } from '../services/admin.service';

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

  // ✅ Added 'contacts' to the active tab type
  activeTab: 'dashboard' | 'courses' | 'videos' | 'tutorials' | 'users' | 'deleted-students' | 'teachers' | 'payments' | 'contacts' = 'courses';

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
  targetStats  = { students: 0, teachers: 0, courses: 0 };

  // ─────────────────────────────────────────
  // ✅ CONTACTS STATE  (all fixed)
  // ─────────────────────────────────────────
  private apiBase = 'http://localhost:5000/api';  // ← same base you use for payments

  contactMessages: any[]  = [];
  selectedContact: any    = null;
  contactFilter: string   = 'all';
  replyText: string       = '';
  showTemplates: boolean  = false;
  isSendingReply: boolean = false;
  contactStats: any       = { total: 0, pending: 0, replied: 0 };

  replyTemplates = [
    {
      label: 'Acknowledge receipt',
      text: `Thank you for reaching out to CourseHub! We've received your message and our team will get back to you within 24 hours. We appreciate your patience.`,
    },
    {
      label: 'Payment issue',
      text: `Hi, we sincerely apologize for the inconvenience regarding your payment. Our team has flagged this issue and will resolve it within 2–4 hours. You will receive a confirmation email once it's fixed.`,
    },
    {
      label: 'Course inquiry',
      text: `Thank you for your interest in our courses! We'd be happy to help answer your questions. Please let us know if you need any further details.`,
    },
    {
      label: 'Certificate request',
      text: `We've noted your certificate request. Our team will process it within 3–5 business days and send it to your registered email address.`,
    },
    {
      label: 'Corporate training',
      text: `Thank you for your interest in corporate training with CourseHub! We offer special bulk pricing for teams of 10+. Our team will reach out within 24 hours with a detailed proposal.`,
    },
  ];

  // ✅ HttpClient injected here
  constructor(
    private router: Router,
    private adminService: AdminService,
    private http: HttpClient
  ) {}

  // ─────────────────────────────────────────
  // LIFECYCLE
  // ─────────────────────────────────────────
  ngOnInit(): void {
    this.loadData();
    this.loadTeachers();
    this.loadCourses();
    this.loadStats();
    this.setTab('courses');
    this.userName = sessionStorage.getItem('name') || 'Admin';
    this.userRole = sessionStorage.getItem('role') || 'admin';
  }

  // ─────────────────────────────────────────
  // TAB SWITCHING
  // ─────────────────────────────────────────
  setTab(tab: any): void {
    this.activeTab = tab;
    this.selectedContact = null;   // clear selected message when switching tabs
    this.replyText = '';
    this.showTemplates = false;

    if (tab === 'contacts') {
      this.loadContacts();
    } else {
      this.loadData();
    }
  }

  // ─────────────────────────────────────────
  // TEACHERS
  // ─────────────────────────────────────────
  loadTeachers() {
    this.adminService.getTeachers().subscribe({
      next: (data: any[]) => {
        this.teachersList = data.map(t => ({ id: t.id, name: t.name }));
      },
      error: (err) => console.error('Error loading teachers', err)
    });
  }

  // ─────────────────────────────────────────
  // DATA
  // ─────────────────────────────────────────
  loadData(): void {
    if (this.activeTab === 'contacts') return; // contacts has its own loader

    if (this.activeTab === 'payments') {
      this.adminService.getPayments().subscribe({
        next: (data: any[]) => {
          this.allData     = data;
          this.filteredData = [...data];
        },
        error: (err: any) => console.error('Payments error:', err)
      });
      return;
    }

    this.adminService.getDataByTable(this.activeTab).subscribe({
      next: (data: any[]) => {
        if (this.activeTab === 'courses') {
          this.allData = data.map(c => ({
            ...c,
            title:      c.title      || '',
            category:   c.category   || '',
            instructor: c.instructor || ''
          }));
        } else {
          this.allData = data;
        }

        this.filteredData = [...this.allData];

        if (this.activeTab === 'teachers') this.targetStats.teachers = data.length;
        if (this.activeTab === 'courses')  this.targetStats.courses  = data.length;
        if (this.activeTab === 'users')    this.targetStats.students = data.length;

        this.animateNumbers();
      },
      error: (err: any) => console.error(`Error loading ${this.activeTab}:`, err)
    });
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
    } else if (this.activeTab === 'teachers') {
      this.filteredData = this.allData.filter(item =>
        item.name?.toLowerCase().includes(term)      ||
        item.email?.toLowerCase().includes(term)     ||
        item.expertise?.toLowerCase().includes(term)
      );
    } else if (this.activeTab === 'courses') {
      this.filteredData = this.allData.filter(item =>
        item.title?.toLowerCase().includes(term)      ||
        item.category?.toLowerCase().includes(term)   ||
        item.instructor?.toLowerCase().includes(term)
      );
    } else {
      this.filteredData = [...this.allData];
    }
  }

  // ─────────────────────────────────────────
  // SAVE (add / edit)
  // ─────────────────────────────────────────
  onSave(): void {
    // TEACHERS
    if (this.activeTab === 'teachers') {
      if (!this.formData.fullName || !this.formData.email || !this.formData.expertise) {
        alert('Name, Email and Expertise are required ❌');
        return;
      }

      const payload = {
        id:        this.formData.id,
        name:      this.formData.fullName,
        email:     this.formData.email,
        expertise: this.formData.expertise
      };

      if (this.formData.id) {
        this.adminService.updateTeacher(payload).subscribe({
          next: () => this.handleSuccess('Teacher Updated'),
          error: (err: any) => alert('Update failed: ' + err.message)
        });
      } else {
        this.adminService.saveTeacher(payload).subscribe({
          next: () => this.handleSuccess('Teacher Added'),
          error: (err: any) => alert('Save failed: ' + err.message)
        });
      }
    }

    // STUDENTS
    else if (this.activeTab === 'users') {
      if (!this.formData.fullName || !this.formData.email) {
        alert('Name and Email are required ❌');
        return;
      }

      const payload = {
        id:    this.formData.id,
        name:  this.formData.fullName,
        email: this.formData.email,
        role:  'student'
      };

      if (this.formData.id) {
        this.adminService.updateStudent(payload).subscribe({
          next: () => this.handleSuccess('Student Updated'),
          error: (err: any) => alert('Update failed: ' + err.message)
        });
      } else {
        this.adminService.saveStudent(payload).subscribe({
          next: () => this.handleSuccess('Student Added'),
          error: (err: any) => alert('Save failed: ' + err.message)
        });
      }
    }

    // COURSES
    else if (this.activeTab === 'courses') {
      if (!this.formData.title || !this.formData.category || !this.formData.instructor) {
        alert('All course fields required ❌');
        return;
      }

      if (this.formData.id) {
        this.adminService.updateCourse({
          id:         this.formData.id,
          title:      this.formData.title,
          category:   this.formData.category,
          instructor: this.formData.instructor,
          status:     this.formData.status
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

  // ─────────────────────────────────────────
  // DELETE
  // ─────────────────────────────────────────
  deleteItem(id: number): void {
    if (!confirm('Are you sure you want to delete this record?')) return;

    let table = '';

    if (this.activeTab === 'users' || this.activeTab === 'deleted-students') {
      table = 'users';
    } else if (this.activeTab === 'teachers') {
      table = 'teachers';
    } else if (this.activeTab === 'courses') {
      table = 'courses';
    } else if (this.activeTab === 'videos') {
      table = 'course-content';
    }

    if (!table) {
      alert('Error: Unknown table for deletion');
      return;
    }

    this.adminService.deleteContent(table, id).subscribe({
      next: () => {
        alert('Deleted successfully ✅');
        this.loadData();
        this.loadStats();
      },
      error: (err) => {
        console.error('DELETE ERROR:', err);
        const errorMsg = err.status === 401 ? 'Unauthorized - Please re-login' : 'Delete failed ❌';
        alert(errorMsg);
      }
    });
  }

  // ─────────────────────────────────────────
  // RESTORE
  // ─────────────────────────────────────────
  restoreStudent(id: number): void {
    if (confirm('Restore this record?')) {
      this.adminService.restoreUser(id).subscribe({
        next: () => this.loadData(),
        error: (err: any) => alert('Restore failed: ' + err.message)
      });
    }
  }

  // ─────────────────────────────────────────
  // MODAL
  // ─────────────────────────────────────────
  editItem(item: any): void {
    this.formData = {
      id:         item.id,
      fullName:   item.name       || '',
      email:      item.email      || '',
      expertise:  item.expertise  || '',
      title:      item.title      || '',
      category:   item.category   || 'Development',
      instructor: item.instructor || '',
      user:       item.user       || '',
      course:     item.course     || '',
      amount:     item.amount     || '',
      status:     item.status     || 'published'
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
      id:         null,
      fullName:   '',
      email:      '',
      expertise:  '',
      title:      '',
      category:   'Development',
      instructor: '',
      user:       '',
      course:     '',
      amount:     '',
      status:     'published'
    };
    this.selectedFile = null;
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

  // ─────────────────────────────────────────
  // COURSES / VIDEOS
  // ─────────────────────────────────────────
  coursesList: any[]    = [];
  courseContents: any[] = [];
  selectedCourseId: number | null = null;

  loadCourses() {
    this.adminService.getDataByTable('courses').subscribe({
      next: (data: any[]) => this.coursesList = data,
      error: err => console.error(err)
    });
  }

  onCourseSelect(event: any) {
    const courseId = Number(event.target.value);
    this.selectedCourseId = courseId;

    if (!courseId) return;

    this.adminService.getCourseContent(courseId).subscribe({
      next: (res: any[]) => this.courseContents = res,
      error: (err) => {
        console.error(err);
        alert('Failed to load content');
      }
    });
  }

  // ─────────────────────────────────────────
  // STATS + ANIMATION
  // ─────────────────────────────────────────
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

  animateNumbers(): void {
    const duration = 1500;
    const steps    = 50;
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

  // ─────────────────────────────────────────
  // PAYMENTS
  // ─────────────────────────────────────────
  viewReceipt(id: number) {
    window.open(`${this.apiBase}/payments/receipt/${id}`, '_blank');
  }

  // ─────────────────────────────────────────
  // DROPDOWN + NAVIGATION
  // ─────────────────────────────────────────
  toggleDropdown() {
    this.showDropdown = !this.showDropdown;
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: any) {
    const clickedInside = event.target.closest('.profile');
    if (!clickedInside) this.showDropdown = false;
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

  // ─────────────────────────────────────────
  // ✅ CONTACTS  (fully fixed)
  // ─────────────────────────────────────────
  loadContacts(): void {
    this.http.get<any[]>(`${this.apiBase}/contacts`).subscribe({
      next: (data) => this.contactMessages = data,
      error: (err) => console.error('Failed to load contacts:', err)
    });

    this.http.get<any>(`${this.apiBase}/contacts/stats`).subscribe({
      next: (stats) => this.contactStats = stats,
      error: (err)  => console.error('Failed to load contact stats:', err)
    });
  }

  getFilteredContacts(): any[] {
    return this.contactMessages.filter(m => {
      if (this.contactFilter === 'pending')  return m.status === 'pending';
      if (this.contactFilter === 'replied')  return m.status === 'replied';
      return true;
    });
  }

  selectContact(msg: any): void {
    this.selectedContact = msg;
    this.replyText       = '';
    this.showTemplates   = false;
    // No status change on open — enum only has 'pending' and 'replied'
  }

  applyTemplate(text: string): void {
    this.replyText     = text;
    this.showTemplates = false;
  }

  sendReply(): void {
    if (!this.replyText.trim() || !this.selectedContact || this.isSendingReply) return;

    this.isSendingReply = true;

    this.http
      .post(`${this.apiBase}/contacts/${this.selectedContact.id}/reply`, {
        reply: this.replyText.trim()
      })
      .subscribe({
        next: () => {
          // Update local state immediately
          this.selectedContact.reply      = this.replyText.trim();
          this.selectedContact.replied_at = new Date().toISOString();
          this.selectedContact.status     = 'replied';

          // Update stats counters
          this.contactStats.replied = (this.contactStats.replied || 0) + 1;
          this.contactStats.pending = Math.max(0, (this.contactStats.pending || 1) - 1);

          this.replyText      = '';
          this.isSendingReply = false;

          alert(`✅ Reply sent to ${this.selectedContact.email}`);
        },
        error: (err) => {
          console.error('Reply failed:', err);
          this.isSendingReply = false;
          alert('❌ Failed to send reply. Please check your email config.');
        }
      });
  }

  deleteContact(id: number): void {
    if (!confirm('Delete this message permanently?')) return;

    this.http.delete(`${this.apiBase}/contacts/${id}`).subscribe({
      next: () => {
        this.contactMessages  = this.contactMessages.filter(m => m.id !== id);
        this.selectedContact  = null;
        this.contactStats.total = Math.max(0, (this.contactStats.total || 1) - 1);
      },
      error: (err) => console.error('Delete failed:', err)
    });
  }
}
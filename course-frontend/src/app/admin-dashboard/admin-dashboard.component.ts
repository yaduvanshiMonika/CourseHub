import { Component, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AdminService } from '../services/admin.service';
import Swal, { SweetAlertResult } from 'sweetalert2';

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
  Math = Math;

  activeTab: 'dashboard' | 'courses' | 'videos' | 'tutorials' | 'users' | 'deleted-students' | 'teachers' | 'payments' | 'contacts' = 'courses';

  allData: any[] = [];
  selectedFile: File | null = null;
  teachersList: any[] = [];
  searchTerm: string = '';
  filteredData: any[] = [];
  showDropdown: boolean = false;

  formData = {
    id: null, fullName: '', email: '', expertise: '',
    title: '', category: 'Development', instructor: '',
    user: '', course: '', amount: '', status: 'published'
  };

  displayStats = { students: 0, teachers: 0, courses: 0 };
  targetStats  = { students: 0, teachers: 0, courses: 0 };

  // ─────────────────────────────────────────
  // GLASS SWAL HELPER — one place, used everywhere
  // icons: ✅ ❌ ⚠️ 🗑️ ✉️ 🚪 ❓
  // colors: green=rgba(68,221,136,0.95)  red=rgba(255,100,100,0.95)
  //         orange=rgba(255,170,50,0.95)  blue=rgba(88,166,255,0.95)
  // ─────────────────────────────────────────
  private glassSwal(opts: {
    icon: string;
    title: string;
    text?: string;
    color?: string;
    timer?: number;
    confirm?: string;
    cancel?: string;
  }): Promise<SweetAlertResult> {
    const color  = opts.color  || 'rgba(255,255,255,0.9)';
    const timer  = opts.timer;
    const hasBtn = !!(opts.confirm);

    return Swal.fire({
      showConfirmButton: hasBtn,
      showCancelButton:  !!(opts.cancel),
      confirmButtonText: opts.confirm || '',
      cancelButtonText:  opts.cancel  || '',
      timer:             hasBtn ? undefined : (timer || 2000),
      timerProgressBar:  !hasBtn,
      position:         'center',
      background:       'transparent',
    backdrop: 'rgba(0,0,0,0.75)',
      customClass:      { popup: 'swal-naked' },
      html: `
        <div class="gs-card">
          <div class="gs-icon">${opts.icon}</div>
          <div class="gs-title" style="color:${color}">${opts.title}</div>
          ${opts.text ? `<div class="gs-text">${opts.text}</div>` : ''}
        </div>
      `,
    });
  }

  // ─────────────────────────────────────────
  // PAGINATION
  // ─────────────────────────────────────────
  currentPage: number  = 1;
  itemsPerPage: number = 8;

  get totalPages(): number { return Math.ceil(this.filteredData.length / this.itemsPerPage); }

  get paginatedData(): any[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredData.slice(start, start + this.itemsPerPage);
  }

  get pageNumbers(): number[] {
    const total = this.totalPages, current = this.currentPage, pages: number[] = [];
    if (total <= 5) { for (let i = 1; i <= total; i++) pages.push(i); }
    else {
      pages.push(1);
      if (current > 3) pages.push(-1);
      const s = Math.max(2, current - 1), e = Math.min(total - 1, current + 1);
      for (let i = s; i <= e; i++) pages.push(i);
      if (current < total - 2) pages.push(-1);
      pages.push(total);
    }
    return pages;
  }

  goToPage(page: number): void { if (page >= 1 && page <= this.totalPages) this.currentPage = page; }
  resetPage(): void { this.currentPage = 1; }

  // ─────────────────────────────────────────
  // CONTACTS STATE
  // ─────────────────────────────────────────
  private apiBase = 'http://localhost:5000/api';

  contactMessages: any[]  = [];
  selectedContact: any    = null;
  contactFilter: string   = 'all';
  replyText: string       = '';
  showTemplates: boolean  = false;
  isSendingReply: boolean = false;
  contactStats: any       = { total: 0, pending: 0, replied: 0 };

  replyTemplates = [
    { label: 'Acknowledge receipt', text: `Thank you for reaching out to CourseHub! We've received your message and our team will get back to you within 24 hours.` },
    { label: 'Payment issue',       text: `We sincerely apologize for the payment inconvenience. Our team has flagged this and will resolve it within 2–4 hours.` },
    { label: 'Course inquiry',      text: `Thank you for your interest in our courses! We'd be happy to help answer your questions.` },
    { label: 'Certificate request', text: `We've noted your certificate request. Our team will process it within 3–5 business days.` },
    { label: 'Corporate training',  text: `Thank you for your interest in corporate training! We offer bulk pricing for teams of 10+. Our team will reach out within 24 hours.` },
  ];

  constructor(private router: Router, private adminService: AdminService, private http: HttpClient) {}

  // ─────────────────────────────────────────
  // LIFECYCLE
  // ─────────────────────────────────────────
  ngOnInit(): void {
    this.loadData(); this.loadTeachers(); this.loadCourses(); this.loadStats();
    this.setTab('courses');
    this.userName = sessionStorage.getItem('name') || 'Admin';
    this.userRole = sessionStorage.getItem('role') || 'admin';
  }

  // ─────────────────────────────────────────
  // TAB SWITCHING
  // ─────────────────────────────────────────
  setTab(tab: any): void {
    this.activeTab = tab;
    this.selectedContact = null; this.replyText = ''; this.showTemplates = false;
    this.resetPage();
    tab === 'contacts' ? this.loadContacts() : this.loadData();
  }

  // ─────────────────────────────────────────
  // TEACHERS
  // ─────────────────────────────────────────
  loadTeachers() {
    this.adminService.getTeachers().subscribe({
      next: (data: any[]) => this.teachersList = data.map(t => ({ id: t.id, name: t.name })),
      error: (err) => console.error('Error loading teachers', err)
    });
  }

  // ─────────────────────────────────────────
  // DATA
  // ─────────────────────────────────────────
  loadData(): void {
    if (this.activeTab === 'contacts') return;

    if (this.activeTab === 'payments') {
      this.adminService.getPayments().subscribe({
        next: (data: any[]) => { this.allData = data; this.filteredData = [...data]; this.resetPage(); },
        error: (err: any) => console.error('Payments error:', err)
      });
      return;
    }

    this.adminService.getDataByTable(this.activeTab).subscribe({
      next: (data: any[]) => {
        this.allData = this.activeTab === 'courses'
          ? data.map(c => ({ ...c, title: c.title||'', category: c.category||'', instructor: c.instructor||'' }))
          : data;
        this.filteredData = [...this.allData];
        this.resetPage();
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
    if (!term) { this.filteredData = [...this.allData]; }
    else if (this.activeTab === 'users') {
      this.filteredData = this.allData.filter(i => i.name?.toLowerCase().includes(term) || i.email?.toLowerCase().includes(term));
    } else if (this.activeTab === 'teachers') {
      this.filteredData = this.allData.filter(i => i.name?.toLowerCase().includes(term) || i.email?.toLowerCase().includes(term) || i.expertise?.toLowerCase().includes(term));
    } else if (this.activeTab === 'courses') {
      this.filteredData = this.allData.filter(i => i.title?.toLowerCase().includes(term) || i.category?.toLowerCase().includes(term) || i.instructor?.toLowerCase().includes(term));
    } else { this.filteredData = [...this.allData]; }
    this.resetPage();
  }

  // ─────────────────────────────────────────
  // SAVE
  // ─────────────────────────────────────────
  onSave(): void {
    if (this.activeTab === 'teachers') {
      if (!this.formData.fullName || !this.formData.email || !this.formData.expertise) {
        this.glassSwal({ icon: '⚠️', title: 'Missing Fields', text: 'Name, Email and Expertise are required.', color: 'rgba(255,170,50,0.95)', confirm: 'OK' }); return;
      }
      const p = { id: this.formData.id, name: this.formData.fullName, email: this.formData.email, expertise: this.formData.expertise };
      if (this.formData.id) {
        this.adminService.updateTeacher(p).subscribe({ next: () => this.handleSuccess('Teacher Updated ✅'), error: (e: any) => this.glassSwal({ icon: '❌', title: 'Update Failed', text: e.message, color: 'rgba(255,100,100,0.95)', confirm: 'OK' }) });
      } else {
        this.adminService.saveTeacher(p).subscribe({ next: () => this.handleSuccess('Teacher Added ✅'), error: (e: any) => this.glassSwal({ icon: '❌', title: 'Save Failed', text: e.message, color: 'rgba(255,100,100,0.95)', confirm: 'OK' }) });
      }
    }

    else if (this.activeTab === 'users') {
      if (!this.formData.fullName || !this.formData.email) {
        this.glassSwal({ icon: '⚠️', title: 'Missing Fields', text: 'Name and Email are required.', color: 'rgba(255,170,50,0.95)', confirm: 'OK' }); return;
      }
      const p = { id: this.formData.id, name: this.formData.fullName, email: this.formData.email, role: 'student' };
      if (this.formData.id) {
        this.adminService.updateStudent(p).subscribe({ next: () => this.handleSuccess('Student Updated ✅'), error: (e: any) => this.glassSwal({ icon: '❌', title: 'Update Failed', text: e.message, color: 'rgba(255,100,100,0.95)', confirm: 'OK' }) });
      } else {
        this.adminService.saveStudent(p).subscribe({ next: () => this.handleSuccess('Student Added ✅'), error: (e: any) => this.glassSwal({ icon: '❌', title: 'Save Failed', text: e.message, color: 'rgba(255,100,100,0.95)', confirm: 'OK' }) });
      }
    }

    else if (this.activeTab === 'courses') {
      if (!this.formData.title || !this.formData.category || !this.formData.instructor) {
        this.glassSwal({ icon: '⚠️', title: 'Missing Fields', text: 'All course fields are required.', color: 'rgba(255,170,50,0.95)', confirm: 'OK' }); return;
      }
      if (this.formData.id) {
        this.adminService.updateCourse({ id: this.formData.id, title: this.formData.title, category: this.formData.category, instructor: this.formData.instructor, status: this.formData.status })
          .subscribe({ next: () => this.handleSuccess('Course Updated ✅'), error: (e: any) => this.glassSwal({ icon: '❌', title: 'Update Failed', text: e.message, color: 'rgba(255,100,100,0.95)', confirm: 'OK' }) });
      } else {
        this.adminService.uploadCourse(this.formData.title, this.formData.category, this.formData.instructor, this.selectedFile, this.formData.status)
          .subscribe({ next: () => this.handleSuccess('Course Added ✅'), error: (e: any) => this.glassSwal({ icon: '❌', title: 'Save Failed', text: e.message, color: 'rgba(255,100,100,0.95)', confirm: 'OK' }) });
      }
    }
  }

  private handleSuccess(type: string): void {
    this.glassSwal({ icon: '✅', title: type, text: 'Changes saved successfully.', color: 'rgba(68,221,136,0.95)', timer: 2000 });
    this.closeModal(); this.loadData(); this.resetForm();
  }

  // ─────────────────────────────────────────
  // DELETE
  // ─────────────────────────────────────────
  async deleteItem(id: number): Promise<void> {
    const result = await this.glassSwal({ icon: '🗑️', title: 'Are you sure?', text: 'This record will be permanently deleted.', color: 'rgba(255,100,100,0.95)', confirm: 'Yes, Delete', cancel: 'Cancel' });
    if (!result.isConfirmed) return;

    let table = '';
    if (this.activeTab === 'users' || this.activeTab === 'deleted-students') table = 'users';
    else if (this.activeTab === 'teachers') table = 'teachers';
    else if (this.activeTab === 'courses')  table = 'courses';
    else if (this.activeTab === 'videos')   table = 'course-content';

    if (!table) { this.glassSwal({ icon: '❌', title: 'Error', text: 'Unknown table for deletion.', color: 'rgba(255,100,100,0.95)', confirm: 'OK' }); return; }

    this.adminService.deleteContent(table, id).subscribe({
      next: () => { this.glassSwal({ icon: '🗑️', title: 'Deleted!', text: 'Record removed successfully.', color: 'rgba(255,100,100,0.95)', timer: 1800 }); this.loadData(); this.loadStats(); },
      error: (err) => { const msg = err.status === 401 ? 'Unauthorized — please re-login' : 'Delete failed'; this.glassSwal({ icon: '❌', title: 'Delete Failed', text: msg, color: 'rgba(255,100,100,0.95)', confirm: 'OK' }); }
    });
  }

  // ─────────────────────────────────────────
  // RESTORE
  // ─────────────────────────────────────────
  async restoreStudent(id: number): Promise<void> {
    const result = await this.glassSwal({ icon: '♻️', title: 'Restore this record?', color: 'rgba(68,221,136,0.95)', confirm: 'Yes, Restore', cancel: 'Cancel' });
    if (result.isConfirmed) {
      this.adminService.restoreUser(id).subscribe({
        next: () => this.loadData(),
        error: (e: any) => this.glassSwal({ icon: '❌', title: 'Restore Failed', text: e.message, color: 'rgba(255,100,100,0.95)', confirm: 'OK' })
      });
    }
  }

  // ─────────────────────────────────────────
  // MODAL
  // ─────────────────────────────────────────
  editItem(item: any): void {
    this.formData = { id: item.id, fullName: item.name||'', email: item.email||'', expertise: item.expertise||'', title: item.title||'', category: item.category||'Development', instructor: item.instructor||'', user: item.user||'', course: item.course||'', amount: item.amount||'', status: item.status||'published' };
    this.showModal = true;
  }

  openAddModal() { this.resetForm(); this.showModal = true; }
  closeModal()   { this.showModal = false; this.resetForm(); }

  resetForm() {
    this.formData = { id: null, fullName: '', email: '', expertise: '', title: '', category: 'Development', instructor: '', user: '', course: '', amount: '', status: 'published' };
    this.selectedFile = null;
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file && file.type === 'application/pdf') { this.selectedFile = file; }
    else if (file) { this.glassSwal({ icon: '⚠️', title: 'Invalid File', text: 'Please select a valid PDF file.', color: 'rgba(255,170,50,0.95)', confirm: 'OK' }); this.selectedFile = null; }
  }

  // ─────────────────────────────────────────
  // COURSES / VIDEOS
  // ─────────────────────────────────────────
  coursesList: any[] = []; courseContents: any[] = []; selectedCourseId: number | null = null;

  loadCourses() { this.adminService.getDataByTable('courses').subscribe({ next: (data: any[]) => this.coursesList = data, error: err => console.error(err) }); }

  onCourseSelect(event: any) {
    const courseId = Number(event.target.value);
    this.selectedCourseId = courseId;
    if (!courseId) return;
    this.adminService.getCourseContent(courseId).subscribe({
      next: (res: any[]) => this.courseContents = res,
      error: (err) => { console.error(err); this.glassSwal({ icon: '❌', title: 'Failed', text: 'Could not load course content.', color: 'rgba(255,100,100,0.95)', confirm: 'OK' }); }
    });
  }

  // ─────────────────────────────────────────
  // STATS + ANIMATION
  // ─────────────────────────────────────────
  loadStats(): void {
    this.adminService.getDataByTable('users').subscribe(data => { this.targetStats.students = data.length; this.animateNumbers(); });
    this.adminService.getDataByTable('teachers').subscribe(data => { this.targetStats.teachers = data.length; this.animateNumbers(); });
    this.adminService.getDataByTable('courses').subscribe(data => { this.targetStats.courses = data.length; this.animateNumbers(); });
  }

  animateNumbers(): void {
    const steps = 50;
    const timer = setInterval(() => {
      let done = true;
      for (const key of ['students','teachers','courses'] as const) {
        if (this.displayStats[key] < this.targetStats[key]) {
          this.displayStats[key] = Math.min(this.displayStats[key] + Math.ceil(this.targetStats[key]/steps), this.targetStats[key]);
          done = false;
        }
      }
      if (done) clearInterval(timer);
    }, 1500/steps);
  }

  // ─────────────────────────────────────────
  // PAYMENTS
  // ─────────────────────────────────────────
  viewReceipt(id: number) { window.open(`${this.apiBase}/payments/receipt/${id}`, '_blank'); }

  // ─────────────────────────────────────────
  // DROPDOWN + NAVIGATION
  // ─────────────────────────────────────────
  toggleDropdown() { this.showDropdown = !this.showDropdown; }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: any) { if (!event.target.closest('.profile')) this.showDropdown = false; }

  goToWebsite() { this.showDropdown = false; this.router.navigate(['/']); }

  async logout(): Promise<void> {
    this.showDropdown = false;
    const result = await this.glassSwal({ icon: '🚪', title: 'Logging Out', text: 'Are you sure you want to logout?', color: 'rgba(255,120,120,0.95)', confirm: 'Yes, Logout', cancel: 'Cancel' });
    if (result.isConfirmed) { sessionStorage.clear(); this.router.navigate(['/login']); }
  }

  // ─────────────────────────────────────────
  // CONTACTS
  // ─────────────────────────────────────────
  loadContacts(): void {
    this.http.get<any[]>(`${this.apiBase}/contacts`).subscribe({ next: (data) => this.contactMessages = data, error: (err) => console.error('Failed to load contacts:', err) });
    this.http.get<any>(`${this.apiBase}/contacts/stats`).subscribe({ next: (stats) => this.contactStats = stats, error: (err) => console.error('Failed to load contact stats:', err) });
  }

  getFilteredContacts(): any[] {
    return this.contactMessages.filter(m => {
      if (this.contactFilter === 'pending') return m.status === 'pending';
      if (this.contactFilter === 'replied') return m.status === 'replied';
      return true;
    });
  }

  selectContact(msg: any): void { this.selectedContact = msg; this.replyText = ''; this.showTemplates = false; }
  applyTemplate(text: string): void { this.replyText = text; this.showTemplates = false; }

  sendReply(): void {
    if (!this.replyText.trim() || !this.selectedContact || this.isSendingReply) return;
    this.isSendingReply = true;
    this.http.post(`${this.apiBase}/contacts/${this.selectedContact.id}/reply`, { reply: this.replyText.trim() }).subscribe({
      next: () => {
        this.selectedContact.reply      = this.replyText.trim();
        this.selectedContact.replied_at = new Date().toISOString();
        this.selectedContact.status     = 'replied';
        this.contactStats.replied = (this.contactStats.replied||0) + 1;
        this.contactStats.pending = Math.max(0, (this.contactStats.pending||1) - 1);
        this.replyText = ''; this.isSendingReply = false;
        this.glassSwal({ icon: '✉️', title: 'Reply Sent!', text: `Email delivered to ${this.selectedContact.email}`, color: 'rgba(68,221,136,0.95)', timer: 2000 });
      },
      error: (err) => {
        console.error('Reply failed:', err); this.isSendingReply = false;
        this.glassSwal({ icon: '❌', title: 'Reply Failed', text: 'Could not send email. Check your email config.', color: 'rgba(255,100,100,0.95)', confirm: 'OK' });
      }
    });
  }

  async deleteContact(id: number): Promise<void> {
    const result = await this.glassSwal({ icon: '🗑️', title: 'Delete message?', text: 'This cannot be undone.', color: 'rgba(255,100,100,0.95)', confirm: 'Yes, Delete', cancel: 'Cancel' });
    if (!result.isConfirmed) return;
    this.http.delete(`${this.apiBase}/contacts/${id}`).subscribe({
      next: () => { this.contactMessages = this.contactMessages.filter(m => m.id !== id); this.selectedContact = null; this.contactStats.total = Math.max(0,(this.contactStats.total||1)-1); },
      error: (err) => console.error('Delete failed:', err)
    });
  }
}
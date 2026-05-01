import { Component, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AdminService } from '../services/admin.service';
import { ThemeService } from '../services/theme.service';
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

  activeTab: 'dashboard' | 'courses' | 'tutorials' | 'users' | 'deleted-students' | 'teachers' | 'payments' | 'contacts' | 'webinars' = 'courses';

  allData: any[] = [];
  selectedFile: File | null = null;
  teachersList: any[] = [];
  searchTerm: string = '';
  filteredData: any[] = [];
  showDropdown: boolean = false;

  formData = {
    id: null, fullName: '', email: '', expertise: '',password: '',  // ✅ ADD THIS

    title: '', category: 'Development', instructor: '',
    user: '', course: '', amount: '', status: 'published',
    validity_days: 90,
    teacher_id: null as number | null,
    price: 0,
    level: 'beginner',
    description: '',
    video_link: '',
    pdf_link: '',
    thumbnailUrl: ''
  };

  displayStats = { students: 0, teachers: 0, courses: 0 };
  targetStats  = { students: 0, teachers: 0, courses: 0 };

  private glassSwal(opts: {
    icon: string; title: string; text?: string; color?: string;
    timer?: number; confirm?: string; cancel?: string;
  }): Promise<SweetAlertResult> {
    const color  = opts.color  || 'rgba(255,255,255,0.9)';
    const hasBtn = !!(opts.confirm);
    return Swal.fire({
      showConfirmButton: hasBtn, showCancelButton: !!(opts.cancel),
      confirmButtonText: opts.confirm || '', cancelButtonText: opts.cancel || '',
      timer: hasBtn ? undefined : (opts.timer || 2000), timerProgressBar: !hasBtn,
      position: 'center', background: 'transparent', backdrop: 'rgba(0,0,0,0.75)',
      customClass: { popup: 'swal-naked' },
      html: `<div class="gs-card">
        <div class="gs-icon">${opts.icon}</div>
        <div class="gs-title" style="color:${color}">${opts.title}</div>
        ${opts.text ? `<div class="gs-text">${opts.text}</div>` : ''}
      </div>`,
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
  // API BASE
  // ─────────────────────────────────────────
  private apiBase = 'https://coursehub-production-b7b9.up.railway.app/api';

  // ─────────────────────────────────────────
  // CONTACTS STATE
  // ─────────────────────────────────────────
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

  // ─────────────────────────────────────────
  // WEBINARS STATE
  // ─────────────────────────────────────────
  webinarRequests: any[]   = [];
  webinarStats: any        = { total: 0, pending: 0, confirmed: 0, rejected: 0, completed: 0 };
  webinarFilter: string    = 'all';
  selectedWebinar: any     = null;
  webinarNotes: string     = '';
  webinarStatusUpdate: string = '';
  /** Agreed slot + join details (saved with status; included in confirmed/completed emails) */
  webinarScheduledStart = '';
  webinarScheduledEnd = '';
  webinarMeetingLink = '';
  webinarMeetingNotes = '';

  constructor(
    private router: Router,
    private adminService: AdminService,
    private http: HttpClient,
    public theme: ThemeService,
    private sanitizer: DomSanitizer
  ) {}

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
    this.selectedContact = null; this.selectedWebinar = null;
    this.replyText = ''; this.showTemplates = false;
    this.resetPage();
    if (tab === 'courses') {
      this.selectedCourseId = null;
      this.resetVideoContentForm();
      this.courseContents = [];
      this.groupedVideoContents = [];
    }
    if (tab === 'contacts') this.loadContacts();
    else if (tab === 'webinars') this.loadWebinars();
    else this.loadData();
  }

  /** Open lesson content (video/PDF) for a course from the Courses tab. */
  openCourseContent(item: { id: number }): void {
    this.selectedCourseId = Number(item.id);
    this.resetVideoContentForm();
    this.loadVideoCourseContents(this.selectedCourseId);
    setTimeout(() => {
      const el = document.querySelector('.adm-videos-inline');
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }

  closeCourseContentPanel(): void {
    this.selectedCourseId = null;
    this.resetVideoContentForm();
    this.courseContents = [];
    this.groupedVideoContents = [];
  }

  getSelectedCourseTitle(): string {
    const id = this.selectedCourseId;
    if (id == null) return '';
    const row =
      this.allData.find((c: any) => Number(c.id) === Number(id)) ||
      this.coursesList.find((c: any) => Number(c.id) === Number(id));
    return row?.title || `Course #${id}`;
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
    if (this.activeTab === 'contacts' || this.activeTab === 'webinars') return;
    if (this.activeTab === 'dashboard') {
      this.allData = [];
      this.filteredData = [];
      this.searchTerm = '';
      this.resetPage();
      return;
    }
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
//   onSave(): void {
//     if (this.activeTab === 'teachers') {
//       // if (!this.formData.fullName || !this.formData.email || !this.formData.expertise || (!this.formData.id && !this.formData.password)) {
//       //   this.glassSwal({ icon: '⚠️', title: 'Missing Fields', text: 'Name, Email and Expertise are required.', color: 'rgba(255,170,50,0.95)', confirm: 'OK' }); return;
//       // }
//       if (!this.formData.fullName || !this.formData.email || !this.formData.expertise || (!this.formData.id && !this.formData.password)) {
//   this.glassSwal({ icon: '⚠️', title: 'Missing Fields', text: 'Name, Email, Expertise and Password are required.', color: 'rgba(255,170,50,0.95)', confirm: 'OK' }); return;
// }
//       const p = { id: this.formData.id, name: this.formData.fullName, email: this.formData.email, expertise: this.formData.expertise ,  password: this.formData.password };
//       if (this.formData.id) {
//         this.adminService.updateTeacher(p).subscribe({ next: () => this.handleSuccess('Teacher Updated ✅'), error: (e: any) => this.glassSwal({ icon: '❌', title: 'Update Failed', text: e.message, color: 'rgba(255,100,100,0.95)', confirm: 'OK' }) });
//       } else {
//         this.adminService.saveTeacher(p).subscribe({ next: () => this.handleSuccess('Teacher Added ✅'), error: (e: any) => this.glassSwal({ icon: '❌', title: 'Save Failed', text: e.message, color: 'rgba(255,100,100,0.95)', confirm: 'OK' }) });
//       }
//     } else if (this.activeTab === 'users') {
//       if (!this.formData.fullName || !this.formData.email) {
//         this.glassSwal({ icon: '⚠️', title: 'Missing Fields', text: 'Name and Email are required.', color: 'rgba(255,170,50,0.95)', confirm: 'OK' }); return;
//       }
//       const p = { id: this.formData.id, name: this.formData.fullName, email: this.formData.email, role: 'student' };
//       if (this.formData.id) {
//         this.adminService.updateStudent(p).subscribe({ next: () => this.handleSuccess('Student Updated ✅'), error: (e: any) => this.glassSwal({ icon: '❌', title: 'Update Failed', text: e.message, color: 'rgba(255,100,100,0.95)', confirm: 'OK' }) });
//       } else {
//         this.adminService.saveStudent(p).subscribe({ next: () => this.handleSuccess('Student Added ✅'), error: (e: any) => this.glassSwal({ icon: '❌', title: 'Save Failed', text: e.message, color: 'rgba(255,100,100,0.95)', confirm: 'OK' }) });
//       }
//     } else if (this.activeTab === 'courses') {
//       if (!this.formData.title || !this.formData.category || !this.formData.teacher_id) {
//         this.glassSwal({ icon: '⚠️', title: 'Missing Fields', text: 'Title, Category and Teacher are required.', color: 'rgba(255,170,50,0.95)', confirm: 'OK' }); return;
//       }

//       const teacher = this.teachersList.find(t => Number(t.id) === Number(this.formData.teacher_id));
//       const instructorName = teacher?.name || this.formData.instructor || '';

//       if (this.formData.id) {
//         this.adminService.updateCourse({
//           id: this.formData.id,
//           title: this.formData.title,
//           category: this.formData.category,
//           instructor: instructorName,
//           teacher_id: Number(this.formData.teacher_id),
//           price: Number(this.formData.price || 0),
//           status: this.formData.status,
//           validity_days: this.formData.validity_days,
//           level: this.formData.level,
//           description: this.formData.description,
//           video_link: this.formData.video_link,
//           pdf_link: this.formData.pdf_link,
//           thumbnailUrl: this.formData.thumbnailUrl
//         })
//           .subscribe({ next: () => this.handleSuccess('Course Updated ✅'), error: (e: any) => this.glassSwal({ icon: '❌', title: 'Update Failed', text: e.message, color: 'rgba(255,100,100,0.95)', confirm: 'OK' }) });
//       } else {
//         this.adminService.uploadCourse(
//           this.formData.title,
//           this.formData.category,
//           instructorName,
//           this.selectedFile,
//           this.formData.status,
//           this.formData.validity_days,
//           Number(this.formData.teacher_id),
//           Number(this.formData.price || 0),
//           this.formData.level,
//           this.formData.description,
//           this.formData.video_link,
//           this.formData.pdf_link,
//           this.formData.thumbnailUrl
//         )
//           .subscribe({ next: () => this.handleSuccess('Course Added ✅'), error: (e: any) => this.glassSwal({ icon: '❌', title: 'Save Failed', text: e.message, color: 'rgba(255,100,100,0.95)', confirm: 'OK' }) });
//       }
//     }
//   }

onSave(): void {
  if (this.activeTab === 'teachers') {
    const isEditing = !!this.formData.id;

    if (!this.formData.fullName) {
      this.glassSwal({ icon: '⚠️', title: 'Missing Fields', text: 'Name is required.', color: 'rgba(255,170,50,0.95)', confirm: 'OK' }); return;
    }
    if (!this.formData.email) {
      this.glassSwal({ icon: '⚠️', title: 'Missing Fields', text: 'Email is required.', color: 'rgba(255,170,50,0.95)', confirm: 'OK' }); return;
    }
    if (!this.formData.expertise) {
      this.glassSwal({ icon: '⚠️', title: 'Missing Fields', text: 'Expertise is required.', color: 'rgba(255,170,50,0.95)', confirm: 'OK' }); return;
    }
    if (!isEditing && !this.formData.password) {
      this.glassSwal({ icon: '⚠️', title: 'Missing Fields', text: 'Password is required for new teachers.', color: 'rgba(255,170,50,0.95)', confirm: 'OK' }); return;
    }

    const p: any = {
      id: this.formData.id,
      name: this.formData.fullName,
      email: this.formData.email,
        password: this.formData.password ,
      expertise: this.formData.expertise
    };
    

    if (isEditing) {
      this.adminService.updateTeacher(p).subscribe({
        next: () => this.handleSuccess('Teacher Updated ✅'),
        error: (e: any) => this.glassSwal({ icon: '❌', title: 'Update Failed', text: e.message, color: 'rgba(255,100,100,0.95)', confirm: 'OK' })
      });
    } else {
      this.adminService.saveTeacher(p).subscribe({
        next: () => this.handleSuccess('Teacher Added ✅'),
        error: (e: any) => this.glassSwal({ icon: '❌', title: 'Save Failed', text: e.message, color: 'rgba(255,100,100,0.95)', confirm: 'OK' })
      });
    }

  } else if (this.activeTab === 'users') {
    if (!this.formData.fullName || !this.formData.email) {
      this.glassSwal({ icon: '⚠️', title: 'Missing Fields', text: 'Name and Email are required.', color: 'rgba(255,170,50,0.95)', confirm: 'OK' }); return;
    }
    const p = { id: this.formData.id, name: this.formData.fullName, email: this.formData.email, role: 'student' };
    if (this.formData.id) {
      this.adminService.updateStudent(p).subscribe({
        next: () => this.handleSuccess('Student Updated ✅'),
        error: (e: any) => this.glassSwal({ icon: '❌', title: 'Update Failed', text: e.message, color: 'rgba(255,100,100,0.95)', confirm: 'OK' })
      });
    } else {
      this.adminService.saveStudent(p).subscribe({
        next: () => this.handleSuccess('Student Added ✅'),
        error: (e: any) => this.glassSwal({ icon: '❌', title: 'Save Failed', text: e.message, color: 'rgba(255,100,100,0.95)', confirm: 'OK' })
      });
    }

  } else if (this.activeTab === 'courses') {
    if (!this.formData.title || !this.formData.category || !this.formData.teacher_id) {
      this.glassSwal({ icon: '⚠️', title: 'Missing Fields', text: 'Title, Category and Teacher are required.', color: 'rgba(255,170,50,0.95)', confirm: 'OK' }); return;
    }

    const teacher = this.teachersList.find(t => Number(t.id) === Number(this.formData.teacher_id));
    const instructorName = teacher?.name || this.formData.instructor || '';

    if (this.formData.id) {
      this.adminService.updateCourse({
        id: this.formData.id,
        title: this.formData.title,
        category: this.formData.category,
        instructor: instructorName,
        teacher_id: Number(this.formData.teacher_id),
        price: Number(this.formData.price || 0),
        status: this.formData.status,
        validity_days: this.formData.validity_days,
        level: this.formData.level,
        description: this.formData.description,
        video_link: this.formData.video_link,
        pdf_link: this.formData.pdf_link,
        thumbnailUrl: this.formData.thumbnailUrl
      }).subscribe({
        next: () => this.handleSuccess('Course Updated ✅'),
        error: (e: any) => this.glassSwal({ icon: '❌', title: 'Update Failed', text: e.message, color: 'rgba(255,100,100,0.95)', confirm: 'OK' })
      });
    } else {
      this.adminService.uploadCourse(
        this.formData.title,
        this.formData.category,
        instructorName,
        this.selectedFile,
        this.formData.status,
        this.formData.validity_days,
        Number(this.formData.teacher_id),
        Number(this.formData.price || 0),
        this.formData.level,
        this.formData.description,
        this.formData.video_link,
        this.formData.pdf_link,
        this.formData.thumbnailUrl
      ).subscribe({
        next: () => this.handleSuccess('Course Added ✅'),
        error: (e: any) => this.glassSwal({ icon: '❌', title: 'Save Failed', text: e.message, color: 'rgba(255,100,100,0.95)', confirm: 'OK' })
      });
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
    if (!table) { this.glassSwal({ icon: '❌', title: 'Error', text: 'Unknown table for deletion.', color: 'rgba(255,100,100,0.95)', confirm: 'OK' }); return; }
    this.adminService.deleteContent(table, id).subscribe({
      next: () => { this.glassSwal({ icon: '🗑️', title: 'Deleted!', text: 'Record removed successfully.', color: 'rgba(255,100,100,0.95)', timer: 1800 }); this.loadData(); this.loadStats(); },
      error: (err) => { const msg = err.status === 401 ? 'Unauthorized — please re-login' : 'Delete failed'; this.glassSwal({ icon: '❌', title: 'Delete Failed', text: msg, color: 'rgba(255,100,100,0.95)', confirm: 'OK' }); }
    });
  }

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
  this.formData = {
    id: item.id,
    fullName: item.name || '',
    email: item.email || '',
    expertise: item.expertise || '',
    password: '',              // ✅ ADD THIS
    title: item.title || '',
    category: item.category || 'Development',
    instructor: item.instructor || '',
    teacher_id: item.teacher_id ?? null,
    user: item.user || '',
    course: item.course || '',
    amount: item.amount || '',
    status: item.status || 'published',
    validity_days: item.validity_days || 90,
    price: item.price || 0,
    level: item.level || 'beginner',
    description: item.description || '',
    video_link: item.video_link || '',
    pdf_link: item.pdf_link || '',
    thumbnailUrl: item.thumbnail_url || item.thumbnailUrl || ''
  };
  this.showModal = true;
}
  openAddModal() { this.resetForm(); this.showModal = true; }
  closeModal()   { this.showModal = false; this.resetForm(); }
  resetForm() {
    this.formData = {
      id: null,
      fullName: '',
      email: '',
      expertise: '',
         password: '',  // ✅ ADD THIS
      title: '',
      category: 'Development',
      instructor: '',
      teacher_id: null,
      user: '',
      course: '',
      amount: '',
      status: 'published',
      validity_days: 90,
      price: 0,
      level: 'beginner',
      description: '',
      video_link: '',
      pdf_link: '',
      thumbnailUrl: ''
    };
    this.selectedFile = null;
  }
  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file && file.type === 'application/pdf') { this.selectedFile = file; }
    else if (file) { this.glassSwal({ icon: '⚠️', title: 'Invalid File', text: 'Please select a valid PDF file.', color: 'rgba(255,170,50,0.95)', confirm: 'OK' }); this.selectedFile = null; }
  }

  // ─────────────────────────────────────────
  // COURSES / VIDEOS (same add/edit/delete/PDF/embed flow as teacher course contents)
  // ─────────────────────────────────────────
  coursesList: any[] = [];
  courseContents: any[] = [];
  selectedCourseId: number | null = null;
  groupedVideoContents: any[] = [];
  videoContentLoading = false;
  videoContentData: { title: string; url: string; position: number } = {
    title: '',
    url: '',
    position: 1
  };
  videoEditMode = false;
  videoEditContentId: number | null = null;
  videoSelectedPdf: File | null = null;

  loadCourses() {
    this.adminService.getDataByTable('courses').subscribe({
      next: (data: any[]) => (this.coursesList = data),
      error: (err) => console.error(err)
    });
  }

  loadVideoCourseContents(courseId: number): void {
    this.videoContentLoading = true;
    this.adminService.getCourseContent(courseId).subscribe({
      next: (res: any[]) => {
        this.courseContents = res;
        this.groupedVideoContents = this.groupVideoContents(res);
        this.videoContentLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.videoContentLoading = false;
        this.glassSwal({
          icon: '❌',
          title: 'Failed',
          text: 'Could not load course content.',
          color: 'rgba(255,100,100,0.95)',
          confirm: 'OK'
        });
      }
    });
  }

  private groupVideoContents(contents: any[]): any[] {
    const groupedMap = new Map<string, any>();
    for (const item of contents || []) {
      const key = `${item.position || 0}`;
      if (!groupedMap.has(key)) {
        groupedMap.set(key, {
          id: item.id,
          title: '',
          pdfName: '',
          position: item.position || 1,
          duration: item.duration || 0,
          typeLabel: '',
          videoUrl: null,
          videoId: null,
          pdfId: null
        });
      }
      const existing = groupedMap.get(key);
      if (item.type === 'video') {
        existing.videoUrl = item.url;
        existing.videoId = item.id;
        if (!existing.title) existing.title = item.title || '';
      }
      if (item.type === 'pdf') {
        existing.pdfId = item.id;
        existing.pdfName = item.pdf_name || '';
      }
      if (existing.videoUrl && existing.pdfName) existing.typeLabel = 'video + pdf';
      else if (existing.videoUrl) existing.typeLabel = 'video';
      else if (existing.pdfName) existing.typeLabel = 'pdf';
    }
    return Array.from(groupedMap.values()).sort(
      (a, b) => Number(a.position) - Number(b.position)
    );
  }

  onVideoPdfFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.videoSelectedPdf = input.files?.[0] || null;
  }

  getVideoSafeUrl(url: string): SafeResourceUrl | string {
    if (!url) return '';
    const match =
      url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/) ||
      url.match(/youtube\.com\/embed\/([^&?/]+)/);
    const videoId = match ? match[1] : null;
    if (videoId) {
      return this.sanitizer.bypassSecurityTrustResourceUrl(
        `https://www.youtube.com/embed/${videoId}`
      );
    }
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  formatVideoDuration(totalSeconds: number): string {
    const seconds = Number(totalSeconds) || 0;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    const hh = String(hours).padStart(2, '0');
    const mm = String(minutes).padStart(2, '0');
    const ss = String(remainingSeconds).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  }

  submitVideoContent(): void {
    if (!this.selectedCourseId) return;

    const formData = new FormData();
    const title = (this.videoContentData.title || '').trim();
    const videoUrl = (this.videoContentData.url || '').trim();
    const position = String(Number(this.videoContentData.position) || 1);
    const hasVideoUrl = !!videoUrl;
    const hasPdfFile = !!this.videoSelectedPdf;

    if (!title) {
      this.glassSwal({ icon: '⚠️', title: 'Title required', color: 'rgba(255,170,50,0.95)', confirm: 'OK' });
      return;
    }
    if (!hasVideoUrl && !hasPdfFile) {
      this.glassSwal({
        icon: '⚠️',
        title: 'Video or PDF',
        text: 'Add a video URL or choose a PDF file.',
        color: 'rgba(255,170,50,0.95)',
        confirm: 'OK'
      });
      return;
    }

    formData.append('title', title);
    formData.append('position', position);
    if (hasVideoUrl) formData.append('url', videoUrl);
    if (hasPdfFile && this.videoSelectedPdf) formData.append('pdf', this.videoSelectedPdf);

    const existingAtPos = this.groupedVideoContents.find(
      (c) => Number(c.position) === Number(position)
    );
    if (existingAtPos && !this.videoEditMode) {
      this.glassSwal({
        icon: '⚠️',
        title: 'Position taken',
        text: 'This position is already used.',
        color: 'rgba(255,170,50,0.95)',
        confirm: 'OK'
      });
      return;
    }

    if (this.videoEditMode && this.videoEditContentId !== null) {
      this.adminService.updateCourseContent(this.videoEditContentId, formData).subscribe({
        next: () => {
          this.glassSwal({ icon: '✅', title: 'Updated', timer: 1800 });
          this.resetVideoContentForm();
          this.loadVideoCourseContents(this.selectedCourseId!);
        },
        error: () =>
          this.glassSwal({ icon: '❌', title: 'Update failed', color: 'rgba(255,100,100,0.95)', confirm: 'OK' })
      });
      return;
    }

    this.adminService.addCourseContents(this.selectedCourseId, formData).subscribe({
      next: () => {
        this.glassSwal({ icon: '✅', title: 'Added', timer: 1800 });
        this.resetVideoContentForm();
        this.loadVideoCourseContents(this.selectedCourseId!);
      },
      error: () =>
        this.glassSwal({ icon: '❌', title: 'Add failed', color: 'rgba(255,100,100,0.95)', confirm: 'OK' })
    });
  }

  editVideoContent(content: any): void {
    this.videoEditMode = true;
    this.videoSelectedPdf = null;
    if (content.videoId) this.videoEditContentId = content.videoId;
    else if (content.pdfId) this.videoEditContentId = content.pdfId;
    this.videoContentData = {
      title: content.title || '',
      url: content.videoUrl || '',
      position: content.position || 1
    };
  }

  cancelVideoEdit(): void {
    this.resetVideoContentForm();
  }

  resetVideoContentForm(): void {
    this.videoEditMode = false;
    this.videoEditContentId = null;
    this.videoContentData = { title: '', url: '', position: 1 };
    this.videoSelectedPdf = null;
  }

  deleteVideoGrouped(content: any): void {
    const ids: number[] = [];
    if (content.videoId) ids.push(content.videoId);
    if (content.pdfId) ids.push(content.pdfId);
    if (!ids.length) {
      this.glassSwal({ icon: '⚠️', title: 'Nothing to delete', color: 'rgba(255,170,50,0.95)', confirm: 'OK' });
      return;
    }
    this.glassSwal({
      icon: '🗑️',
      title: 'Delete this content?',
      text: 'Video and/or PDF at this position will be removed.',
      color: 'rgba(255,100,100,0.95)',
      confirm: 'Delete',
      cancel: 'Cancel'
    }).then((r) => {
      if (!r.isConfirmed) return;
      let done = 0;
      let failed = false;
      ids.forEach((id) => {
        this.adminService.deleteCourseContent(id).subscribe({
          next: () => {
            done++;
            if (done === ids.length && !failed && this.selectedCourseId) {
              this.glassSwal({ icon: '✅', title: 'Deleted', timer: 1600 });
              this.loadVideoCourseContents(this.selectedCourseId);
            }
          },
          error: () => {
            if (!failed) {
              failed = true;
              this.glassSwal({ icon: '❌', title: 'Delete failed', color: 'rgba(255,100,100,0.95)', confirm: 'OK' });
            }
          }
        });
      });
    });
  }

  downloadAdminContentPdf(pdfId: number): void {
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    fetch(`https://coursehub-production-b7b9.up.railway.app/api/admin/content/pdf/${pdfId}`, {
      headers: { Authorization: `Bearer ${token || ''}` }
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('pdf');
        const blob = await res.blob();
        const blobUrl = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
        window.open(blobUrl, '_blank');
        setTimeout(() => window.URL.revokeObjectURL(blobUrl), 60000);
      })
      .catch(() =>
        this.glassSwal({ icon: '❌', title: 'PDF open failed', color: 'rgba(255,100,100,0.95)', confirm: 'OK' })
      );
  }

  // ─────────────────────────────────────────
  // STATS
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
  // DROPDOWN
  // ─────────────────────────────────────────
  toggleDropdown() { this.showDropdown = !this.showDropdown; }
  @HostListener('document:click', ['$event'])
  onClickOutside(event: any) { if (!event.target.closest('.profile')) this.showDropdown = false; }
  // goToWebsite() { this.showDropdown = false; this.router.navigate(['/']); }
  goToWebsite() { this.showDropdown = false; window.location.href='/'; }
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
        this.selectedContact.reply = this.replyText.trim();
        this.selectedContact.replied_at = new Date().toISOString();
        this.selectedContact.status = 'replied';
        this.contactStats.replied = (this.contactStats.replied||0) + 1;
        this.contactStats.pending = Math.max(0, (this.contactStats.pending||1) - 1);
        this.replyText = ''; this.isSendingReply = false;
        this.glassSwal({ icon: '✉️', title: 'Reply Sent!', text: `Email delivered to ${this.selectedContact.email}`, color: 'rgba(68,221,136,0.95)', timer: 2000 });
      },
      error: (err) => { console.error('Reply failed:', err); this.isSendingReply = false; this.glassSwal({ icon: '❌', title: 'Reply Failed', text: 'Could not send email.', color: 'rgba(255,100,100,0.95)', confirm: 'OK' }); }
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

  // ─────────────────────────────────────────
  // ✅ WEBINARS
  // ─────────────────────────────────────────
  loadWebinars(): void {
    const keepId = this.selectedWebinar?.id ?? null;
    this.http.get<any[]>(`${this.apiBase}/webinar`).subscribe({
      next: (data) => {
        this.webinarRequests = data;
        if (keepId != null) {
          const row = data.find((x: any) => x.id === keepId);
          if (row) this.selectWebinar(row);
        }
      },
      error: (err) => console.error('Failed to load webinars:', err)
    });
    this.http.get<any>(`${this.apiBase}/webinar/stats`).subscribe({
      next: (stats) => this.webinarStats = stats,
      error: (err) => console.error('Failed to load webinar stats:', err)
    });
  }

  getFilteredWebinars(): any[] {
    return this.webinarRequests.filter(w => {
      if (this.webinarFilter === 'all') return true;
      return w.status === this.webinarFilter;
    });
  }

  selectWebinar(w: any): void {
    this.selectedWebinar = w;
    this.webinarStatusUpdate = w.status;
    this.webinarNotes = w.admin_notes || '';
    this.webinarScheduledStart = this.toDatetimeLocalInput(w.scheduled_start);
    this.webinarScheduledEnd = this.toDatetimeLocalInput(w.scheduled_end);
    this.webinarMeetingLink = w.meeting_link || '';
    this.webinarMeetingNotes = w.meeting_notes || '';
  }

  /** Bind MySQL / ISO datetime strings to `<input type="datetime-local">` */
  private toDatetimeLocalInput(v: string | null | undefined): string {
    if (v == null || v === '') return '';
    const s = String(v).replace(' ', 'T');
    const noZ = s.replace(/\.\d{3}Z?$/, '').replace(/Z$/, '');
    return noZ.length >= 16 ? noZ.slice(0, 16) : noZ;
  }

  /** Send to API as `YYYY-MM-DD HH:mm:ss` (naive local wall time from picker) */
  private fromDatetimeLocalForApi(s: string): string | null {
    const t = (s || '').trim();
    if (!t) return null;
    if (t.length === 16) return `${t.replace('T', ' ')}:00`;
    return t.replace('T', ' ');
  }

  async updateWebinarStatus(): Promise<void> {
    if (!this.selectedWebinar || !this.webinarStatusUpdate) return;

    const mode = String(this.selectedWebinar.mode || '').toLowerCase();
    const expectsLink = mode.includes('online') || mode.includes('hybrid') || mode.includes('virtual');
    if (this.webinarStatusUpdate === 'confirmed' && expectsLink && !this.webinarMeetingLink.trim()) {
      const r = await this.glassSwal({
        icon: '⚠️', title: 'No meeting link',
        text: 'This request looks online/hybrid. Add a meeting link before confirming, or continue if you will send it separately.',
        color: 'rgba(255,170,50,0.95)', confirm: 'Save anyway', cancel: 'Go back'
      });
      if (!r.isConfirmed) return;
    }

    const result = await this.glassSwal({
      icon: '📋', title: 'Update Status?',
      text: `Mark as "${this.webinarStatusUpdate}" and notify the organisation.`,
      color: 'rgba(88,166,255,0.95)', confirm: 'Yes, Update', cancel: 'Cancel'
    });
    if (!result.isConfirmed) return;

    this.http.patch<{ webinar?: any }>(`${this.apiBase}/webinar/${this.selectedWebinar.id}`, {
      status: this.webinarStatusUpdate,
      admin_notes: this.webinarNotes,
      scheduled_start: this.fromDatetimeLocalForApi(this.webinarScheduledStart),
      scheduled_end: this.fromDatetimeLocalForApi(this.webinarScheduledEnd),
      meeting_link: this.webinarMeetingLink.trim() || null,
      meeting_notes: this.webinarMeetingNotes.trim() || null
    }).subscribe({
      next: (res) => {
        if (res.webinar) {
          this.selectedWebinar = res.webinar;
          this.selectWebinar(res.webinar);
        }
        this.loadWebinars();
        this.glassSwal({ icon: '✅', title: 'Status Updated!', text: 'Organisation has been notified.', color: 'rgba(68,221,136,0.95)', timer: 2000 });
      },
      error: (err) => { console.error(err); this.glassSwal({ icon: '❌', title: 'Failed', text: 'Could not update status.', color: 'rgba(255,100,100,0.95)', confirm: 'OK' }); }
    });
  }

  async deleteWebinar(id: number): Promise<void> {
    const result = await this.glassSwal({ icon: '🗑️', title: 'Delete request?', text: 'This cannot be undone.', color: 'rgba(255,100,100,0.95)', confirm: 'Yes, Delete', cancel: 'Cancel' });
    if (!result.isConfirmed) return;
    this.http.delete(`${this.apiBase}/webinar/${id}`).subscribe({
      next: () => {
        this.webinarRequests = this.webinarRequests.filter(w => w.id !== id);
        if (this.selectedWebinar?.id === id) this.selectedWebinar = null;
        this.webinarStats.total = Math.max(0, (this.webinarStats.total||1) - 1);
        this.glassSwal({ icon: '🗑️', title: 'Deleted!', text: 'Webinar request removed.', color: 'rgba(255,100,100,0.95)', timer: 1800 });
      },
      error: (err) => console.error('Delete failed:', err)
    });
  }

  getStatusColor(status: string): string {
    const colors: any = {
      pending:   'rgba(255,170,50,0.15)',
      confirmed: 'rgba(68,221,136,0.15)',
      rejected:  'rgba(255,100,100,0.15)',
      completed: 'rgba(88,166,255,0.15)'
    };
    return colors[status] || 'rgba(255,255,255,0.05)';
  }

  getStatusTextColor(status: string): string {
    const colors: any = {
      pending:   '#ffaa44',
      confirmed: '#44dd88',
      rejected:  '#ff6464',
      completed: '#58a6ff'
    };
    return colors[status] || '#888';
  }
}
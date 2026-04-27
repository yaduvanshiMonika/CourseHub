import { Component, OnInit } from '@angular/core';
import { StudentService } from 'src/app/services/student.service';

export type StudentContactRow = {
  id: number;
  name?: string;
  email?: string;
  phone?: string;
  subject?: string;
  message?: string;
  reply?: string | null;
  status?: string;
  created_at?: string;
  replied_at?: string;
};

@Component({
  selector: 'app-student-messages',
  templateUrl: './student-messages.component.html',
  styleUrls: ['./student-messages.component.css']
})
export class StudentMessagesComponent implements OnInit {
  loading = true;
  error: string | null = null;
  accountEmail = '';
  messages: StudentContactRow[] = [];
  selected: StudentContactRow | null = null;

  constructor(private student: StudentService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = null;
    this.student.getStudentProfile().subscribe({
      next: (res: any) => {
        const p = res?.data || res;
        this.accountEmail = p?.email || sessionStorage.getItem('email') || '';
      },
      error: () => { /* still load messages */ }
    });

    this.student.getMyContactMessages().subscribe({
      next: (res: any) => {
        const d = res?.data;
        this.messages = (Array.isArray(d) ? d : []) as StudentContactRow[];
        if (!this.accountEmail && this.messages[0]?.email) {
          this.accountEmail = String(this.messages[0].email);
        }
        this.selected = this.messages[0] || null;
        this.loading = false;
      },
      error: (err) => {
        this.error =
          err?.status === 401
            ? 'Please sign in again to view your messages.'
            : 'Could not load your messages. Try again in a moment.';
        this.loading = false;
        this.messages = [];
        this.selected = null;
      }
    });
  }

  select(m: StudentContactRow): void {
    this.selected = m;
  }

  hasReply(m: StudentContactRow | null): boolean {
    if (!m) return false;
    return !!(m.reply && String(m.reply).trim().length);
  }
}

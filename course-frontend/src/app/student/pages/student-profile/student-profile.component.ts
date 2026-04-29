import { Component, OnInit } from '@angular/core';
import { StudentService } from 'src/app/services/student.service';

@Component({
  selector: 'app-student-profile',
  templateUrl: './student-profile.component.html',
  styleUrls: ['./student-profile.component.css']
})
export class StudentProfileComponent implements OnInit {
  loading: boolean = false;
  saving: boolean = false;

  profile: any = {
    name: '',
    email: '',
    phone: '',
    bio: '',
    photo: '',
    enrolledCourses: 0
  };

  constructor(private studentService: StudentService) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.loading = true;
    this.studentService.getStudentProfile().subscribe({
      next: (res) => {
        this.loading = false;
        if (res?.success && res.data) {
          this.profile = {
            name: res.data.name || '',
            email: res.data.email || '',
            phone: res.data.phone || '',
            bio: res.data.bio || '',
            photo: res.data.photo || '',
            enrolledCourses: res.data.enrolledCourses || 0
          };
        }
      },
      error: (err) => {
        this.loading = false;
        console.error('Profile load error:', err);
      }
    });
  }

  updateProfile(): void {
    this.saving = true;
    const payload = {
      name: this.profile.name,
      phone: this.profile.phone,
      bio: this.profile.bio
    };
    this.studentService.updateStudentProfile(payload).subscribe({
      next: (res) => {
        this.saving = false;
        if (res?.data) {
          this.profile.name = res.data.name || this.profile.name;
          this.profile.phone = res.data.phone || this.profile.phone;
          this.profile.bio = res.data.bio || this.profile.bio;
        }
        alert(res?.message || 'Profile updated successfully ✅');
      },
      error: (err) => {
        this.saving = false;
        console.error('Update profile error:', err);
        alert('Failed to update profile ❌');
      }
    });
  }

  updatePhoto(): void {
    if (!this.profile.photo || !this.profile.photo.trim()) {
      alert('Please enter photo URL first');
      return;
    }
    this.studentService.updateStudentPhoto(this.profile.photo).subscribe({
      next: (res) => {
        alert(res?.message || 'Photo updated successfully ✅');
      },
      error: (err) => {
        console.error('Update photo error:', err);
        alert('Failed to update photo ❌');
      }
    });
  }
}
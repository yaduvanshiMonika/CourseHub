import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TeacherService } from 'src/app/services/teacher.service';

@Component({
  selector: 'app-add-course',
  templateUrl: './add-course.component.html',
  styleUrls: ['./add-course.component.css']
})
export class AddCourseComponent implements OnInit {
  isEditMode: boolean = false;
  editCourseId: number | null = null;


    // NEW
  showSuccessModal = false;
  showErrorModal = false;
  swirlMessage = '';


  courseData: any = {
    title: '',
    category: '',
    instructor: '',
    price: '',
    status: 'draft',
     level: 'beginner',
    validity_days: 90,
    description: '',
    video_link: '',
    // pdf_link: '',
    thumbnailUrl: ''
  };
  selectedFile: File | null = null;

  constructor(
    private teacherService: TeacherService,
    private router: Router
  ) {}

  onFileSelect(event: any) {
  const file = event.target.files[0];
  if (file) {
    this.selectedFile = file;
  }
}

  ngOnInit(): void {
    const navState = history.state;

    if (navState && navState.editCourse) {
      this.isEditMode = true;
      this.editCourseId = navState.editCourse.id;

      this.courseData = {
        title: navState.editCourse.title || '',
        category: navState.editCourse.category || '',
        instructor: navState.editCourse.instructor || '',
        price: navState.editCourse.price || '',
        status: navState.editCourse.status || 'draft',
        level: navState.editCourse.level || 'beginner',
        validity_days: navState.editCourse.validity_days || 90,
        description: navState.editCourse.description || '',
        video_link: navState.editCourse.video_link || '',
        pdf_link: navState.editCourse.pdf_link || '',
        thumbnailUrl: navState.editCourse.thumbnail_url || ''
      };
    }
  }

  // submitCourse(): void {
  //   if (this.isEditMode && this.editCourseId) {
  //     this.teacherService.updateCourse(this.editCourseId, this.courseData).subscribe({
  //       next: () => {
  //         alert('Course updated successfully');
  //         this.router.navigate(['/teacher/my-courses']);
  //       },
  //       error: (err) => {
  //         console.error('Update course error:', err);
  //         alert('Course update failed');
  //       }
  //     });
  //   } else {
  //     this.teacherService.addCourse(this.courseData).subscribe({
  //       next: () => {
  //         alert('Course added successfully');
  //         this.router.navigate(['/teacher/my-courses']);
  //       },
  //       error: (err) => {
  //         console.error('Add course error:', err);
  //         alert('Course add failed');
  //       }
  //     });
  //   }
  // }



  //today close
  // submitCourse(): void {

  // if (this.isEditMode && this.editCourseId) {
  //   this.teacherService.updateCourse(this.editCourseId, this.courseData).subscribe({
  //     next: () => {
  //       alert('Course updated successfully');
  //       this.router.navigate(['/teacher/my-courses']);
  //     },
  //     error: (err) => {
  //       console.error('Update course error:', err);
  //       alert('Course update failed');
  //     }
  //   });

  // } else {

    

    // // 🔥 CASE 1: FILE UPLOAD
    // if (this.selectedFile) {
    //   const formData = new FormData();

    //   Object.keys(this.courseData).forEach(key => {
    //     formData.append(key, this.courseData[key]);
    //   });

    //   formData.append('file', this.selectedFile);

    //   this.teacherService.uploadCourseWithPdf(formData).subscribe({
    //     next: () => {
    //       alert('Course added with PDF upload');
    //       this.router.navigate(['/teacher/my-courses']);
    //     },
    //     error: (err) => {
    //       console.error(err);
    //       alert('Upload failed');
    //     }
    //   });

  //   } else {
  //     // 🔥 CASE 2: NORMAL (URL)
  //     this.teacherService.addCourse(this.courseData).subscribe({
  //       next: () => {
  //         alert('Course added successfully');
  //         this.router.navigate(['/teacher/my-courses']);
  //       },
  //       error: (err) => {
  //         console.error('Add course error:', err);
  //         alert('Course add failed');
  //       }
  //     });
  //   }
//   }
// }


  // NEW
  showSwirl(message: string, isError = false) {
    this.swirlMessage = message;
    if (isError) {
      this.showErrorModal = true;
    } else {
      this.showSuccessModal = true;
    }
  }

  // NEW
  closeModal() {
    this.showSuccessModal = false;
    this.router.navigate(['/teacher/my-courses']);
  }

  // NEW
  closeErrorModal() {
    this.showErrorModal = false;
  }



submitCourse(): void {

  // 🔥 EDIT MODE
  if (this.isEditMode && this.editCourseId) {
    this.teacherService.updateCourse(this.editCourseId, this.courseData).subscribe({
      next: () => {
        // alert('Course updated successfully');
        this.showSwirl('Course updated successfully');
        // this.router.navigate(['/teacher/my-courses']);
      },
      error: (err) => {
        console.error('Update course error:', err);
        // alert('Course update failed');
        this.showSwirl('Course update failed', true);
      }
    });
    return; // 🔥 important
  }

  // 🔥 ADD MODE
  if (this.selectedFile) {
    // 👉 PDF upload case
    const formData = new FormData();

    Object.keys(this.courseData).forEach((key) => {
      formData.append(key, this.courseData[key] ?? '');
    });

    formData.append('file', this.selectedFile);

    this.teacherService.uploadCourseWithPdf(formData).subscribe({
      next: () => {
        // alert('Course added with PDF upload');
         this.showSwirl('Course added with PDF upload');
        // this.router.navigate(['/teacher/my-courses']);
      },
      error: (err) => {
        console.error('Upload course error:', err);
        // alert('Course upload failed');
         this.showSwirl('Course upload failed', true);
      }
    });

  } else {
    // 👉 Normal add (no file)
    this.teacherService.addCourse(this.courseData).subscribe({
      next: () => {
        // alert('Course added successfully');
        this.showSwirl('Course added successfully');
        // this.router.navigate(['/teacher/my-courses']);
      },
      error: (err) => {
        console.error('Add course error:', err);
        // alert('Course add failed');
        this.showSwirl('Course add failed', true);
      }
    });
  }
}







 }
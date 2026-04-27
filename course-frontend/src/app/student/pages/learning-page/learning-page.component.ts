import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { StudentService } from 'src/app/services/student.service';

@Component({
  selector: 'app-learning-page',
  templateUrl: './learning-page.component.html',
  styleUrls: ['./learning-page.component.css']
})
export class LearningPageComponent implements OnInit {

  courseId!: number;
  course: any = null;
  lessons: any[] = [];
  selectedLesson: any = null;

  progressPercent: number = 0;
  completedLessons: number = 0;
  totalLessons: number = 0;

  loading: boolean = false;
  markingSaving = false;

  constructor(
    private route: ActivatedRoute,
    private studentService: StudentService
  ) {}

  ngOnInit(): void {
    this.courseId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadLearningData();
  }

  loadLearningData(): void {
    this.loading = true;

    this.studentService.getLearningPage(this.courseId).subscribe({
      next: (res) => {
        this.loading = false;

        if (res?.success && res.data) {
          this.course = res.data.course;

          this.lessons = (res.data.lessons || []).map((lesson: any) => ({
            ...lesson,
            video_url: this.convertToEmbedUrl(lesson.video_url),
            pdf_url: this.getPdfUrl(lesson.pdf_url),
            video_completed: !!lesson.video_completed
          }));

          this.totalLessons = Number(res.data.total_lessons || 0);
          this.completedLessons = Number(res.data.completed_lessons || 0);
          this.progressPercent = Number(res.data.progress_percent || 0);

          if (this.lessons.length > 0) {
            this.selectedLesson = this.lessons[0];
          } else {
            this.selectedLesson = null;
          }
        }
      },
      error: (err) => {
        this.loading = false;
        console.error('Learning page error:', err);
      }
    });
  }

  selectLesson(lesson: any): void {
    this.selectedLesson = lesson;
  }

  markVideoComplete(): void {
    const lesson = this.selectedLesson;
    if (!lesson?.video_url || lesson.video_completed || this.markingSaving) return;

    const contentId = Number(lesson.video_id || lesson.id);
    if (!Number.isFinite(contentId)) return;

    this.markingSaving = true;
    this.studentService.markLessonComplete(contentId).subscribe({
      next: () => {
        this.markingSaving = false;
        this.loadLearningData();
      },
      error: (err) => {
        this.markingSaving = false;
        console.error(err);
        alert(err?.error?.message || 'Could not save progress.');
      }
    });
  }

  openPdf(url: string): void {
    if (!url) {
      alert('PDF URL not available');
      return;
    }

    this.studentService.downloadProtectedPdf(url).subscribe({
      next: (blob: Blob) => {
        const fileURL = URL.createObjectURL(blob);
        window.open(fileURL, '_blank');
      },
      error: (err) => {
        console.error('PDF open error:', err);
        alert('Failed to open PDF');
      }
    });
  }

  private getPdfUrl(url: string): string {
    if (!url) return '';

    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    return `http://localhost:5000${url}`;
  }

  private convertToEmbedUrl(url: string): string {
    if (!url) return '';

    if (url.includes('youtube.com/embed/')) {
      return url;
    }

    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
      return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
    }

    if (url.includes('watch?v=')) {
      const videoId = url.split('watch?v=')[1]?.split('&')[0];
      return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
    }

    if (url.includes('/shorts/')) {
      const videoId = url.split('/shorts/')[1]?.split('?')[0];
      return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
    }

    return url;
  }
}
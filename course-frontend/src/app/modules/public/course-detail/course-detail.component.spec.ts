import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

import { CourseDetailComponent } from './course-detail.component';
import { CourseService } from 'src/app/services/course.service';
import { TutorialCardImagePipe } from '../pipes/tutorial-card-image.pipe';

describe('CourseDetailComponent', () => {
  let component: CourseDetailComponent;
  let fixture: ComponentFixture<CourseDetailComponent>;

  const courseServiceStub = {
    getCourseById: () =>
      of({
        id: 1,
        title: 'Test',
        category: 'Dev',
        instructor: 'Teacher',
        price: 99,
        curriculum_outline: []
      }),
    checkAccess: () => of({ hasAccess: false }),
    enroll: () => of({ enrollmentId: 1 }),
    createOrder: () => of({ key: 'x', amount: 1, orderId: 'o' }),
    verifyPayment: () => of({ enrollment_id: 1 })
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CourseDetailComponent, TutorialCardImagePipe],
      imports: [HttpClientTestingModule, RouterTestingModule],
      providers: [{ provide: CourseService, useValue: courseServiceStub }]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CourseDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

import { EnrollmentsComponent } from './enrollments.component';
import { TeacherService } from 'src/app/services/teacher.service';

describe('EnrollmentsComponent', () => {
  let component: EnrollmentsComponent;
  let fixture: ComponentFixture<EnrollmentsComponent>;

  const teacherServiceStub = {
    getCourseEnrollments: () => of({ success: true, data: [] })
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EnrollmentsComponent],
      imports: [RouterTestingModule],
      providers: [
        { provide: TeacherService, useValue: teacherServiceStub },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: { get: () => '1' } }
          }
        }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EnrollmentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

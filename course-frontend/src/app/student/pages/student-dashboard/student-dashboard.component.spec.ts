import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

import { StudentDashboardComponent } from './student-dashboard.component';
import { StudentService } from 'src/app/services/student.service';

describe('StudentDashboardComponent', () => {
  let component: StudentDashboardComponent;
  let fixture: ComponentFixture<StudentDashboardComponent>;

  const studentServiceStub = {
    getStudentProfile: () => of({ success: true, data: { name: 'Test', enrolledCourses: 0 } }),
    getStudentCourses: () => of({ success: true, data: [] })
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [StudentDashboardComponent],
      imports: [RouterTestingModule],
      providers: [{ provide: StudentService, useValue: studentServiceStub }]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StudentDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { ReceiptComponent } from './receipt/receipt.component';
import { RoleGuard } from './guards/role.guard';

const routes: Routes = [
  {
    path: 'admin-dashboard',
    component: AdminDashboardComponent,
    canActivate: [RoleGuard],
    data: { expectedRoles: ['admin'] }
  },
  {
    path: 'teacher',
    loadChildren: () =>
      import('./teacher/teacher.module').then(m => m.TeacherModule)
  },
  {
    path: 'student',
    loadChildren: () =>
      import('./student/student.module').then(m => m.StudentModule)
  },
  {
  path: 'receipt/:id',
  component: ReceiptComponent
},
  {
    path: '',
    loadChildren: () =>
      import('./modules/public/public.module').then(m => m.PublicModule)
  },
  {
    path: '**',
    redirectTo: ''
  }
];


@NgModule({
  imports: [RouterModule.forRoot(routes, {
    anchorScrolling: 'enabled',
    scrollPositionRestoration: 'enabled'
  })],
  exports: [RouterModule]
})
export class AppRoutingModule {}
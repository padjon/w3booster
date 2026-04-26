import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard';


export const DashboardRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        component: DashboardComponent,
        data: {
          title: 'Dashboard'
        }
      }
    ]
  }
];

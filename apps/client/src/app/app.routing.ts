import { AuthenticationService } from 'app/data/services';
import { Routes } from '@angular/router';

import { BlankComponent, FullComponent } from '@app/shared';

export const AppRoutes: Routes = [
  {
    path: '',
    canActivateChild: [AuthenticationService],
    component: FullComponent,
    children: [
      {
        path: '',
        redirectTo: '/dashboard',
        pathMatch: 'full',
        data: {
          requiresAuthentication: false
        }
      },
      {
        path: 'dashboard',
        loadChildren: () => import('./dashboard/dashboard.module').then(m => m.DashboardModule),
        data: {
          requiresAuthentication: true
        }
      },
    ]
  },
  {
    path: '',
    component: BlankComponent,
    canActivateChild: [AuthenticationService],
    children: [
      {
        path: '',
        loadChildren:
          () => import('./views/authentication/authentication.module').then(m => m.AuthenticationModule),
        data: {
          requiresAuthentication: false
        }
      },
      {
        path: 'web',
        loadChildren:
          () => import('./views/web/web.module').then(m => m.WebModule),
        data: {
          requiresAuthentication: false
        }
      },
      {
        path: 'payment',
        loadChildren:
          () => import('./views/payment/payment.module').then(m => m.PaymentModule),
        data: {
          requiresAuthentication: false
        }
      }
    ]
  },
  {
    path: '**',
    redirectTo: '/404'
  }
];

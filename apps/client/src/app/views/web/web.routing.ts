import { Routes } from '@angular/router';
import { WelcomeComponent } from './welcome/welcome.component';

export const WebRoutes: Routes = [
  {
    path: '',
    data: {
      title: 'Welcome to W3Booster | '
    },
    children: [
      {
        path: '',
        component: WelcomeComponent,
        data: {
          title: 'Welcome to W3Booster | '
        }
      }
    ]
  }
];

import { Routes } from '@angular/router';
import { WelcomeComponent } from './welcome/welcome.component';

export const WebRoutes: Routes = [
  {
    path: '',
    data: {
      title: 'W3Booster Preview'
    },
    children: [
      {
        path: '',
        component: WelcomeComponent,
        data: {
          title: 'W3Booster Preview'
        }
      }
    ]
  }
];

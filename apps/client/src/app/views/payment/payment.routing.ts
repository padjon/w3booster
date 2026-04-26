import { Routes } from '@angular/router';
import { PaymentComponent } from './payment.component';

export const PaymentRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        component: PaymentComponent,
        data: {
          title: 'Payment'
        }
      }
    ]
  }
];

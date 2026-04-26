import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { SharedModule } from '@app/shared';
import { PaymentComponent } from './payment.component';
import { PaymentRoutes } from './payment.routing';
import { RouterModule } from '@angular/router';
import { UserService, ShopOrderService } from '@app/data/modelservices';

@NgModule({
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    NgbModule,
    SharedModule,
    RouterModule.forChild(PaymentRoutes),
  ],
  declarations: [PaymentComponent],
  providers: [
    UserService,
    ShopOrderService
  ]
})
export class PaymentModule { }

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { DashboardRoutes } from '@app/dashboard/dashboard.routing';
import { DashboardComponent } from '@app/dashboard/dashboard/dashboard.component';
import { NgToggleModule } from '@nth-cloud/ng-toggle';
import {  UserService, ShopOrderService } from '@app/data/modelservices';
import { NgSelectModule } from '@ng-select/ng-select';
import { CompactDashboardComponent } from './minified-dashboard/compact-dashboard.component';
import { EventsystemComponent } from './dashboard/eventsystem/eventsystem.component';



@NgModule({
    imports: [
        FormsModule,
        CommonModule,
        NgbModule,
        NgToggleModule,
        RouterModule.forChild(DashboardRoutes),
        NgSelectModule
    ],
    declarations: [DashboardComponent, CompactDashboardComponent, EventsystemComponent],
    providers: [
        UserService,
        /*StreamlabsService,*/
        ShopOrderService
    ]
})
export class DashboardModule { }

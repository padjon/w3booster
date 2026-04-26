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
import { PersonaGuard } from './guards/persona.guard';
import { NotificationBellComponent } from './components/notification-bell/notification-bell.component';
import { PersonaPickerComponent } from './components/persona-picker/persona-picker.component';
import { PersonaToggleComponent } from './components/persona-toggle/persona-toggle.component';
import { ProLockComponent } from './components/pro-lock/pro-lock.component';
import { RecorderStatusChipComponent } from './components/recorder-status-chip/recorder-status-chip.component';
import { AutomationPageComponent } from './pages/automation/automation-page.component';
import { BuildOrdersPageComponent } from './pages/build-orders/build-orders-page.component';
import { AccountPageComponent } from './pages/account/account-page.component';
import { DevelopersPageComponent } from './pages/developers/developers-page.component';
import { DashboardHomeRedirectComponent } from './pages/home-redirect/dashboard-home-redirect.component';
import { InsightsPageComponent } from './pages/insights/insights-page.component';
import { OverlayEditorPageComponent } from './pages/overlay-editor/overlay-editor-page.component';
import { OverlayLibraryPageComponent } from './pages/overlay-library/overlay-library-page.component';
import { PracticeHubPageComponent } from './pages/practice-hub/practice-hub-page.component';
import { ReplayDetailPageComponent } from './pages/replay-detail/replay-detail-page.component';
import { StreamHubPageComponent } from './pages/stream-hub/stream-hub-page.component';
import { MockDataService } from './services/mock-data.service';
import { PersonaService } from './services/persona.service';
import { DashboardShellComponent } from './shell/dashboard-shell.component';
import { BuildOrderService } from './services/build-order.service';
import { OverlayConfigService } from './services/overlay-config.service';



@NgModule({
    imports: [
        FormsModule,
        CommonModule,
        NgbModule,
        NgToggleModule,
        RouterModule.forChild(DashboardRoutes),
        NgSelectModule
    ],
    declarations: [
        DashboardComponent,
        CompactDashboardComponent,
        EventsystemComponent,
        DashboardShellComponent,
        PersonaToggleComponent,
        NotificationBellComponent,
        RecorderStatusChipComponent,
        PersonaPickerComponent,
        ProLockComponent,
        DashboardHomeRedirectComponent,
        StreamHubPageComponent,
        PracticeHubPageComponent,
        OverlayLibraryPageComponent,
        OverlayEditorPageComponent,
        BuildOrdersPageComponent,
        InsightsPageComponent,
        ReplayDetailPageComponent,
        AutomationPageComponent,
        AccountPageComponent,
        DevelopersPageComponent
    ],
    providers: [
        UserService,
        /*StreamlabsService,*/
        ShopOrderService,
        PersonaService,
        PersonaGuard,
        MockDataService,
        BuildOrderService,
        OverlayConfigService
    ]
})
export class DashboardModule { }

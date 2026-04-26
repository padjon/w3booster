import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard';
import { PersonaGuard } from './guards/persona.guard';
import { DashboardShellComponent } from './shell/dashboard-shell.component';
import { DashboardHomeRedirectComponent } from './pages/home-redirect/dashboard-home-redirect.component';
import { StreamHubPageComponent } from './pages/stream-hub/stream-hub-page.component';
import { PracticeHubPageComponent } from './pages/practice-hub/practice-hub-page.component';
import { OverlayLibraryPageComponent } from './pages/overlay-library/overlay-library-page.component';
import { OverlayEditorPageComponent } from './pages/overlay-editor/overlay-editor-page.component';
import { BuildOrdersPageComponent } from './pages/build-orders/build-orders-page.component';
import { InsightsPageComponent } from './pages/insights/insights-page.component';
import { ReplayDetailPageComponent } from './pages/replay-detail/replay-detail-page.component';
import { AutomationPageComponent } from './pages/automation/automation-page.component';
import { AccountPageComponent } from './pages/account/account-page.component';
import { DevelopersPageComponent } from './pages/developers/developers-page.component';


export const DashboardRoutes: Routes = [
  {
    path: 'legacy',
    component: DashboardComponent,
    data: {
      title: 'Legacy Dashboard'
    }
  },
  {
    path: '',
    component: DashboardShellComponent,
    children: [
      { path: '', component: DashboardHomeRedirectComponent },
      {
        path: 'stream',
        component: StreamHubPageComponent,
        canActivate: [PersonaGuard],
        data: { title: 'Stream Hub', persona: 'streamer' }
      },
      {
        path: 'practice',
        component: PracticeHubPageComponent,
        canActivate: [PersonaGuard],
        data: { title: 'Practice Hub', persona: 'player' }
      },
      {
        path: 'overlays',
        component: OverlayLibraryPageComponent,
        canActivate: [PersonaGuard],
        data: { title: 'Overlays', persona: 'streamer' }
      },
      {
        path: 'overlays/editor/:id',
        component: OverlayEditorPageComponent,
        canActivate: [PersonaGuard],
        data: { title: 'Overlay Editor', persona: 'streamer' }
      },
      {
        path: 'build-orders',
        component: BuildOrdersPageComponent,
        canActivate: [PersonaGuard],
        data: { title: 'Build Orders', persona: 'player', mode: 'select' }
      },
      {
        path: 'build-orders/manage',
        component: BuildOrdersPageComponent,
        canActivate: [PersonaGuard],
        data: { title: 'Build Manager', persona: 'player', mode: 'manage' }
      },
      {
        path: 'insights',
        component: InsightsPageComponent,
        canActivate: [PersonaGuard],
        data: { title: 'Match Insights', persona: 'player' }
      },
      {
        path: 'insights/replay/:id',
        component: ReplayDetailPageComponent,
        canActivate: [PersonaGuard],
        data: { title: 'Replay Detail', persona: 'player' }
      },
      {
        path: 'automation',
        component: AutomationPageComponent,
        canActivate: [PersonaGuard],
        data: { title: 'Automation', persona: 'streamer' }
      },
      {
        path: 'account',
        component: AccountPageComponent,
        data: { title: 'Account' }
      },
      {
        path: 'developers',
        component: DevelopersPageComponent,
        canActivate: [PersonaGuard],
        data: { title: 'Developers', developer: true }
      }
    ]
  }
];

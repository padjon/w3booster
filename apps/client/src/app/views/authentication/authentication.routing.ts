import { Routes } from '@angular/router';

import { NotFoundComponent } from '@app/views/authentication/404/not-found.component';
import { LoginComponent } from '@app/views/authentication/login/login.component';
import { DeveloperPortalPageComponent } from '../public/developer-portal/developer-portal-page.component';
import { GiftPageComponent } from '../public/gift/gift-page.component';
import { PublicProfilePageComponent } from '../public/public-profile/public-profile-page.component';

export const AuthenticationRoutes: Routes = [
    {
        path: '',
        children: [
            {
                path: '404',
                component: NotFoundComponent
            },
            {
                path: 'login',
                component: LoginComponent
            },
            {
                path: 'gift',
                component: GiftPageComponent
            },
            {
                path: 'gift/:handle',
                component: GiftPageComponent
            },
            {
                path: 'developers',
                component: DeveloperPortalPageComponent
            },
            {
                path: 'p/:handle',
                component: PublicProfilePageComponent
            }
        ]
    }
];

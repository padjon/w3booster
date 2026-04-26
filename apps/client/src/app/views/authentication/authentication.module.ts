import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { NotFoundComponent } from '@app/views/authentication/404/not-found.component';
import { AuthenticationRoutes } from '@app/views/authentication/authentication.routing';
import { LoginComponent } from '@app/views/authentication/login/login.component';
import { SharedModule } from '@app/shared';
import { UserService } from '@app/data/modelservices';
import { DeveloperPortalPageComponent } from '../public/developer-portal/developer-portal-page.component';
import { GiftPageComponent } from '../public/gift/gift-page.component';
import { PublicProfilePageComponent } from '../public/public-profile/public-profile-page.component';

@NgModule({
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    NgbModule,
    SharedModule,
    RouterModule.forChild(AuthenticationRoutes)
  ],
  declarations: [
    NotFoundComponent,
    LoginComponent,
    GiftPageComponent,
    DeveloperPortalPageComponent,
    PublicProfilePageComponent
  ],
  providers: [UserService]
})
export class AuthenticationModule {}

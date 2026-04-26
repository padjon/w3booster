import { CommonModule } from '@angular/common';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { NgModule, Injector, ErrorHandler } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ToastrModule } from 'ngx-toastr';
import { APP_INITIALIZER } from '@angular/core';

import { NgToggleModule } from '@nth-cloud/ng-toggle';

import { AppRoutes } from '@app/app.routing';
import { AppComponent } from '@app/app.component';
import { SharedModule } from '@app/shared';
import {
    AuthenticationService,
    ErrorService,
    NodeService,
    ParseService
} from 'app/data/services';
import { UserService, RoleService } from 'app/data/modelservices';
import { GlobalLoggingHandler } from './global-logging.handler';


@NgModule({ declarations: [AppComponent],
    bootstrap: [AppComponent], imports: [CommonModule,
        BrowserModule,
        BrowserAnimationsModule,
        NgbModule,
        RouterModule.forRoot(AppRoutes),
        SharedModule,
        ToastrModule.forRoot(),
        NgToggleModule], providers: [
        AuthenticationService,
        NodeService,
        {
            provide: ErrorHandler,
            useClass: GlobalLoggingHandler,
        },
        {
            provide: APP_INITIALIZER,
            useFactory: AppModule.onAppInit,
            multi: true,
            deps: [Injector]
        },
        ErrorService,
        ParseService,
        RoleService,
        provideHttpClient(withInterceptorsFromDi())
    ] })
export class AppModule {
    private static onAppInit(injector: Injector) {
        return () => {
            return new Promise<void>((resolve, reject) => {
                injector
                    .get(AuthenticationService)
                    .initialize()
                    .then(() => resolve());
            });
        };
    }
}

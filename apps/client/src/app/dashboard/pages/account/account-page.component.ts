import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { User } from 'app/data/models';
import { AuthenticationService } from 'app/data/services';
import { MockDataService } from '../../services/mock-data.service';
import { PersonaService } from '../../services/persona.service';

@Component({
    selector: 'app-account-page',
    templateUrl: './account-page.component.html',
    styleUrls: ['../dashboard-page.css']
})
export class AccountPageComponent {
    public user: User = this.authentication.getAuthenticatedUser();

    constructor(
        public data: MockDataService,
        public persona: PersonaService,
        private authentication: AuthenticationService,
        private router: Router
    ) {}

    public get connectedAccounts() {
        return this.user?.connectedAccounts || [];
    }

    public get gifts() {
        return this.user?.receivedGifts?.length ? this.user.receivedGifts : this.data.getGifts();
    }

    public connect(provider: 'twitch' | 'battlenet') {
        this.router.navigate(['/login'], { queryParams: { connect: provider } });
    }
}

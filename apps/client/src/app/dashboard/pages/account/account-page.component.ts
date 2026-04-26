import { Component } from '@angular/core';

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
    public gifts = this.data.getGifts();

    constructor(
        public data: MockDataService,
        public persona: PersonaService,
        private authentication: AuthenticationService
    ) {}
}

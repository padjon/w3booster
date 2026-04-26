import { Component, Input } from '@angular/core';

import { AuthenticationService } from 'app/data/services';

@Component({
    selector: 'app-pro-lock',
    templateUrl: './pro-lock.component.html',
    styleUrls: ['./pro-lock.component.css']
})
export class ProLockComponent {
    @Input() public feature = '';

    constructor(private authentication: AuthenticationService) {}

    public get locked(): boolean {
        const user = this.authentication.getAuthenticatedUser();
        return !(user && user.isProPlan && user.isProPlan());
    }

    public get handle(): string {
        const user = this.authentication.getAuthenticatedUser();
        return user && (user.displayName || user.username) ? (user.displayName || user.username) : '';
    }
}

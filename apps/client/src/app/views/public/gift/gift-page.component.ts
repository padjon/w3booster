import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '@env/environment';

@Component({
    selector: 'app-gift-page',
    templateUrl: './gift-page.component.html',
    styleUrls: ['../public-page.css']
})
export class GiftPageComponent implements OnInit {
    public handle = '';
    public duration = 30;
    public message = '';
    public checkoutMessage = '';

    constructor(private route: ActivatedRoute, private router: Router) {}

    public ngOnInit(): void {
        this.handle = this.route.snapshot.params.handle || '';
    }

    public continueToPaypal(): void {
        this.checkoutMessage = '';
        if (!this.handle.trim()) {
            this.checkoutMessage = 'Enter a Twitch handle before continuing.';
            return;
        }

        if (this.isE2EMode()) {
            localStorage.setItem('PAYPAL_PENDING_STATE', JSON.stringify({
                state: 'e2e-gift-' + this.duration,
                createdAt: Date.now()
            }));
            this.router.navigate(['/payment']);
            return;
        }

        this.checkoutMessage = 'Gift checkout is waiting for the backend recipient lookup and PayPal order endpoint.';
    }

    private isE2EMode(): boolean {
        if (environment.production || typeof window === 'undefined') {
            return false;
        }
        return localStorage.getItem('W3B_E2E_AUTH') === 'true';
    }
}

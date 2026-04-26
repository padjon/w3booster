import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '@env/environment';
import { HttpClient } from '@angular/common/http';

interface GiftRecipient {
    id: string;
    handle: string;
    displayName: string;
    avatarUrl?: string;
    isPro: boolean;
    planUntil?: string;
}

@Component({
    selector: 'app-gift-page',
    templateUrl: './gift-page.component.html',
    styleUrls: ['../public-page.css']
})
export class GiftPageComponent implements OnInit {
    public handle = '';
    public duration = 30;
    public senderName = '';
    public message = '';
    public checkoutMessage = '';
    public lookupMessage = '';
    public loading = false;
    public recipient: GiftRecipient = null;

    constructor(private route: ActivatedRoute, private router: Router, private http: HttpClient) {}

    public ngOnInit(): void {
        this.handle = this.route.snapshot.params.handle || '';
        if (this.handle) {
            this.lookupRecipient();
        }
    }

    public lookupRecipient(): void {
        const handle = this.normalizedHandle();
        this.checkoutMessage = '';
        this.lookupMessage = '';
        this.recipient = null;
        if (!handle) {
            this.lookupMessage = 'Enter a Twitch handle to check gift availability.';
            return;
        }
        if (this.isE2EMode()) {
            this.recipient = {
                id: 'e2e-recipient',
                handle,
                displayName: handle,
                isPro: false
            };
            return;
        }
        this.loading = true;
        this.http.get(environment.REST_URL + 'gift/lookup/' + encodeURIComponent(handle)).toPromise()
            .then((recipient: GiftRecipient) => {
                this.recipient = recipient;
                this.lookupMessage = '';
            })
            .catch(() => {
                this.lookupMessage = 'No W3Booster account has connected this Twitch handle yet. The recipient has to log in with Twitch once before gifts can be delivered.';
            })
            .finally(() => this.loading = false);
    }

    public continueToPaypal(): void {
        this.startGiftCheckout('paypal');
    }

    public continueToStripe(): void {
        this.startGiftCheckout('stripe');
    }

    private startGiftCheckout(provider: 'paypal' | 'stripe'): void {
        this.checkoutMessage = '';
        const handle = this.normalizedHandle();
        if (!handle) {
            this.checkoutMessage = 'Enter a Twitch handle before continuing.';
            return;
        }

        if (this.isE2EMode()) {
            localStorage.setItem(provider === 'paypal' ? 'PAYPAL_PENDING_STATE' : 'STRIPE_PENDING_STATE', JSON.stringify({
                state: 'e2e-gift-' + provider + '-' + this.duration,
                createdAt: Date.now()
            }));
            this.router.navigate(['/payment']);
            return;
        }

        this.loading = true;
        const body = {
            handle,
            duration: this.duration,
            senderName: this.senderName,
            message: this.message,
            returnTo: window.location.origin + '/payment'
        };
        this.http.post(environment.REST_URL + 'gift/' + provider, body).toPromise()
            .then((result: any) => {
                const state = result?.state;
                const checkoutUrl = provider === 'paypal' ? result?.approvalUrl : result?.checkoutUrl;
                if (!state || !checkoutUrl) {
                    throw new Error('Gift checkout did not return a payment URL.');
                }
                localStorage.setItem(provider === 'paypal' ? 'PAYPAL_PENDING_STATE' : 'STRIPE_PENDING_STATE', JSON.stringify({
                    state,
                    createdAt: Date.now()
                }));
                window.location.href = checkoutUrl;
            })
            .catch((e) => {
                this.checkoutMessage = e?.error?.message || e?.message || 'Gift checkout could not be started.';
            })
            .finally(() => this.loading = false);
    }

    private normalizedHandle(): string {
        return this.handle.replace(/^@/, '').trim();
    }

    private isE2EMode(): boolean {
        if (environment.production || typeof window === 'undefined') {
            return false;
        }
        return localStorage.getItem('W3B_E2E_AUTH') === 'true';
    }
}

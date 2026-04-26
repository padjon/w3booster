import { Component, OnInit, Injector } from '@angular/core';
import { View } from '@app/views/view';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';


@Component({
    selector: 'app-payment',
    templateUrl: './payment.component.html',
    styleUrls: ['./payment.component.scss']
})
export class PaymentComponent extends View implements OnInit {

    public processing = true;
    public error = '';
    public newDate = '';

    private paypalCurrentCheckIndex = 0;
    private paypalCheckCount = 0;
    private readonly PAYPAL_CHECK_INTERVAL = 5000;
    private readonly PAYPAL_MAX_CHECK_COUNT = (15 * 60 * 1000) / this.PAYPAL_CHECK_INTERVAL;
    private readonly PAYPAL_PENDING_STATE_KEY = 'PAYPAL_PENDING_STATE';
    private readonly PAYPAL_PENDING_MAX_AGE_MS = 24 * 60 * 60 * 1000;

    public constructor(protected injector: Injector, private router: Router, private http: HttpClient) {
        super(injector);
    }

    public async ngOnInit() {
        this.processing = true;
        this.cleanupStalePaypalPendingState();
        const pending = this.getPaypalPendingState();
        const pendingState = pending?.state;

        if (pendingState) {
            this.paypalCheckCount = 0;
            const myIndex = ++this.paypalCurrentCheckIndex;
            this.checkForPaypalResult(myIndex, pendingState);
            return;
        }

        this.continue();
    }

    public cancelWaiting() {
        this.paypalCurrentCheckIndex++;
        this.paypalCheckCount = 0;
        localStorage.removeItem(this.PAYPAL_PENDING_STATE_KEY);
        this.forceReturnToDashboard();
    }

    private forceReturnToDashboard() {
        // In Electron, the dashboard initializes native/DLL integrations.
        // A full reload here avoids returning to a stale, partially initialized dashboard state.
        const isElectron = typeof (window as any).require !== 'undefined';
        this.router.navigate(['/dashboard'], { replaceUrl: true }).then(() => {
            if (isElectron) {
                window.location.reload();
            }
        });
    }

    private getPaypalPendingState(): { state: string; createdAt: number } | null {
        const raw = localStorage.getItem(this.PAYPAL_PENDING_STATE_KEY);
        if (!raw) {
            return null;
        }

        // Backwards compat: used to be a plain state string.
        if (raw[0] !== '{') {
            return { state: raw, createdAt: Date.now() };
        }

        try {
            const parsed = JSON.parse(raw);
            if (parsed?.state) {
                return { state: String(parsed.state), createdAt: Number(parsed.createdAt ?? 0) };
            }
        } catch {
            // ignore
        }
        return null;
    }

    private cleanupStalePaypalPendingState() {
        const pending = this.getPaypalPendingState();
        if (!pending) {
            return;
        }

        if (!pending.createdAt || (Date.now() - pending.createdAt) > this.PAYPAL_PENDING_MAX_AGE_MS) {
            localStorage.removeItem(this.PAYPAL_PENDING_STATE_KEY);
        }
    }

    private async checkForPaypalResult(index: number, state: string) {
        try {
            this.paypalCheckCount++;
            const result = await this.http.get(environment.REST_URL + 'paypal/state/' + state).toPromise() as any;
            if (result?.status === 'cancelled') {
                localStorage.removeItem(this.PAYPAL_PENDING_STATE_KEY);
                this.processing = false;
                this.error = 'Payment cancelled in PayPal.';
                return;
            }
            if (result?.status === 'error') {
                localStorage.removeItem(this.PAYPAL_PENDING_STATE_KEY);
                this.processing = false;
                this.error = result?.message ?? 'We could not process the payment.';
                return;
            }
            if (result?.status === 'approved') {
                localStorage.removeItem(this.PAYPAL_PENDING_STATE_KEY);
                this.processing = false;
                this.error = '';
                this.newDate = this.getLocalizedDate(new Date(result.planUntil));
                return;
            }
        } catch {
            // 404 while waiting
        } finally {
            if (this.paypalCurrentCheckIndex === index && this.paypalCheckCount < this.PAYPAL_MAX_CHECK_COUNT) {
                setTimeout(this.checkForPaypalResult.bind(this, index, state), this.PAYPAL_CHECK_INTERVAL);
            }
        }
    }

    public continue() {
        this.router.navigate(['/dashboard']);
    }
}

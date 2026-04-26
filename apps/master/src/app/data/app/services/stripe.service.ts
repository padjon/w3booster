import { ShopItem, User } from 'app/data/models';
import { appConfig } from 'app/config';

export class StripeService {
    private readonly apiBase = 'https://api.stripe.com/v1';

    public isConfigured() {
        return Boolean(appConfig.STRIPE_SECRET_KEY);
    }

    public async createCheckoutSession(
        user: User,
        item: ShopItem,
        state: string,
        successUrl: string,
        cancelUrl: string
    ): Promise<any> {
        this.assertConfigured();

        const body = new URLSearchParams();
        body.set('mode', 'payment');
        body.set('success_url', successUrl);
        body.set('cancel_url', cancelUrl);
        body.set('client_reference_id', user.id);
        body.set('metadata[userId]', user.id);
        body.set('metadata[shopItemId]', item.id);
        body.set('metadata[state]', state);
        body.set('payment_method_types[0]', 'card');
        body.set('line_items[0][quantity]', '1');
        body.set('line_items[0][price_data][currency]', 'eur');
        body.set('line_items[0][price_data][unit_amount]', String(this.getPriceInCents(item)));
        body.set('line_items[0][price_data][product_data][name]', item.description);

        return this.post('/checkout/sessions', body);
    }

    public async retrieveCheckoutSession(sessionId: string): Promise<any> {
        this.assertConfigured();
        const response = await fetch(this.apiBase + '/checkout/sessions/' + encodeURIComponent(sessionId), {
            headers: this.getHeaders()
        });
        return response.json();
    }

    private async post(path: string, body: URLSearchParams): Promise<any> {
        const response = await fetch(this.apiBase + path, {
            method: 'POST',
            headers: {
                ...this.getHeaders(),
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: body.toString()
        });
        return response.json();
    }

    private getHeaders() {
        return {
            Authorization: 'Bearer ' + appConfig.STRIPE_SECRET_KEY
        };
    }

    private assertConfigured() {
        if (!this.isConfigured()) {
            throw new Error('Stripe is not configured.');
        }
    }

    private getPriceInCents(item: ShopItem) {
        return Math.round(Number(item.price) * 100);
    }
}

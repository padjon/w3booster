import { Express } from 'express';
import { BaseAPI } from './base/base.api';
import { ServiceManager, StripeService } from 'app/data/services';
import { ShopOrderService } from 'app/data/modelservices';
import { ShopOrderCloud } from './parse/cloud/functions/shop-order.cloud';

export class StripeAPI extends BaseAPI {
    private shopOrderService = ServiceManager.get(ShopOrderService);
    private stripeService = ServiceManager.get(StripeService);

    constructor(app: Express) {
        super(app);

        this.getRouter().get('/return', (req, res) => {
            const state = (req.query.state as string) ?? '';
            const sessionId = (req.query.session_id as string) ?? '';
            const returnTo = this.getAllowedReturnUrl(req.query.returnTo as string);

            if (!state || !sessionId) {
                res.status(400).send('Missing Stripe checkout parameters.');
                return;
            }

            (async () => {
                try {
                    await ShopOrderCloud.confirmStripeCheckoutCore(this.shopOrderService, this.stripeService, state, sessionId);
                    if (returnTo) {
                        res.redirect(returnTo);
                    } else {
                        res.send('Payment processed successfully. Return to the W3Booster App now. This window can be closed safely.');
                    }
                } catch (e: any) {
                    console.error('Stripe confirm failed:', e);
                    if (returnTo) {
                        const url = new URL(returnTo);
                        url.searchParams.set('stripe', 'error');
                        res.redirect(url.toString());
                    } else {
                        res.send('We could not process your payment. Return to the W3Booster App and check the payment screen for details.');
                    }
                }
            })();
        });

        this.getRouter().get('/cancel', (req, res) => {
            const state = (req.query.state as string) ?? '';
            const returnTo = this.getAllowedReturnUrl(req.query.returnTo as string);
            if (state) {
                (async () => {
                    try {
                        const order = await this.shopOrderService.getFirstByAttribute('stripeState' as any, state, ['user', 'shopItem']);
                        if (order && !order.stripeCancelledAt) {
                            order.stripeCancelledAt = new Date();
                            await order.save();
                        }
                    } catch (e) {
                        console.warn('Stripe cancel handler failed:', e);
                    }
                })();
            }

            if (returnTo) {
                const url = new URL(returnTo);
                url.searchParams.set('stripe', 'cancelled');
                res.redirect(url.toString());
            } else {
                res.send('Payment cancelled. Return to the W3Booster App now. This window can be closed safely.');
            }
        });

        this.getRouter().get('/state/:state', (req, res) => {
            (async () => {
                try {
                    const order = await this.shopOrderService.getFirstByAttribute('stripeState' as any, req.params.state, ['user', 'shopItem']);
                    if (!order) {
                        res.sendStatus(404);
                        return;
                    }

                    if (order.stripeCancelledAt) {
                        res.send({ status: 'cancelled' });
                        return;
                    }

                    if (order.paidAt) {
                        res.send({ status: 'approved', planUntil: order.user?.planUntil?.toISOString?.() });
                        return;
                    }

                    try {
                        await ShopOrderCloud.confirmStripeCheckoutCore(this.shopOrderService, this.stripeService, req.params.state);
                        const refreshedOrder = await this.shopOrderService.getFirstByAttribute('stripeState' as any, req.params.state, ['user', 'shopItem']);
                        res.send({ status: 'approved', planUntil: refreshedOrder.user?.planUntil?.toISOString?.() });
                    } catch {
                        res.send({ status: 'pending' });
                    }
                } catch (e: any) {
                    res.send({ status: 'error', message: e?.message ?? String(e) });
                }
            })();
        });
    }

    private getAllowedReturnUrl(returnTo?: string): string {
        if (!returnTo) {
            return '';
        }

        try {
            const url = new URL(returnTo);
            const host = url.hostname.toLowerCase();
            if ((url.protocol === 'https:' || url.protocol === 'http:') &&
                (host === 'localhost' ||
                    host === '127.0.0.1' ||
                    host === 'w3booster.com' ||
                    host.endsWith('.w3booster.com'))) {
                return url.toString();
            }
        } catch (e) {
            return '';
        }
        return '';
    }
}

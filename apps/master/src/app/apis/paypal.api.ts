import { Express } from 'express';
import { BaseAPI } from './base/base.api';
import { ServiceManager, PaypalService } from 'app/data/services';
import { ShopOrderService } from 'app/data/modelservices';
import { ShopOrderCloud } from './parse/cloud/functions/shop-order.cloud';

export class PaypalAPI extends BaseAPI {
    private shopOrderService = ServiceManager.get(ShopOrderService);
    private paypalService = ServiceManager.get(PaypalService);

    constructor(app: Express) {
        super(app);

        this.getRouter().get('/return', (req, res) => {
            const state = (req.query.state as string) ?? '';
            const paymentId = req.query.paymentId as string;
            const payerId = (req.query.PayerID as string) ?? (req.query.payerId as string);

            if (!state) {
                res.status(400).send('Missing state parameter.');
                return;
            }

            if (!paymentId || !payerId) {
                res.send('Payment could not be confirmed. Return to the W3Booster App now.');
                return;
            }

            (async () => {
                try {
                    const order = await this.shopOrderService.getFirstByAttribute('paypalPaymentId', paymentId, ['user', 'shopItem']);
                    if (!order) {
                        throw new Error('Order not found! ' + paymentId);
                    }

                    // If we created the order with a state, require it to match the callback state.
                    if (order.paypalState && order.paypalState !== state) {
                        throw new Error('Invalid state for this payment.');
                    }

                    // Server-side confirmation using the exact same logic as the cloud function.
                    await ShopOrderCloud.confirmOrderCore(this.shopOrderService, this.paypalService, order.user, paymentId, payerId);
                    res.send('Payment processed successfully. Return to the W3Booster App now. This window can be closed safely.');
                } catch (e: any) {
                    console.error('PayPal confirm failed:', e);
                    res.send('We could not process your payment. Return to the W3Booster App and check the payment screen for details.');
                }
            })();
        });

        this.getRouter().get('/cancel', (req, res) => {
            const state = (req.query.state as string) ?? '';
            if (state) {
                (async () => {
                    try {
                        const order = await this.shopOrderService.getFirstByAttribute('paypalState' as any, state, ['user', 'shopItem']);
                        if (order && !order.paypalCancelledAt) {
                            order.paypalCancelledAt = new Date();
                            await order.save();
                        }
                    } catch (e) {
                        console.warn('PayPal cancel handler failed:', e);
                    }
                })();
            }
            res.send('Payment cancelled. Return to the W3Booster App now. This window can be closed safely.');
        });

        this.getRouter().get('/state/:state', (req, res) => {
            (async () => {
                try {
                    const order = await this.shopOrderService.getFirstByAttribute('paypalState' as any, req.params.state, ['user', 'shopItem']);
                    if (!order) {
                        res.sendStatus(404);
                        return;
                    }

                    if (order.paypalCancelledAt) {
                        res.send({ status: 'cancelled' });
                        return;
                    }

                    const response: any = order.paypalPaymentResponse;
                    if (!response) {
                        res.send({ status: 'pending' });
                        return;
                    }

                    if (response.state === 'approved') {
                        res.send({ status: 'approved', planUntil: order.user?.planUntil?.toISOString?.() });
                        return;
                    }

                    res.send({ status: 'error', message: 'The transaction was not successfully completed. Please contact support if this was unintended.' });
                } catch (e: any) {
                    res.send({ status: 'error', message: e?.message ?? String(e) });
                }
            })();
        });
    }
}

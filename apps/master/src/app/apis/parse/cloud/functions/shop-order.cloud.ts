import { BaseCloud } from './base/base-cloud';
import { ServiceManager, PaypalService, StripeService } from 'app/data/services';
import { ShopItemService, ShopOrderService } from 'app/data/modelservices';
import { ShopItem, User, ShopOrder, EUserPlan } from 'app/data/models';
import { appConfig } from 'app/config';

export interface GiftOrderDetails {
    recipientHandle: string;
    senderName?: string;
    message?: string;
    provider: 'paypal' | 'stripe';
}

export class ShopOrderCloud extends BaseCloud {
    private shopItemService = ServiceManager.get(ShopItemService);
    private shopOrderService = ServiceManager.get(ShopOrderService);
    private paypalService = ServiceManager.get(PaypalService);
    private stripeService = ServiceManager.get(StripeService);

    public static async createOrderCore(
        shopItemService: ShopItemService,
        paypalService: PaypalService,
        user: any,
        itemId: string,
        state?: string
    ) {
        if (user && itemId) {
            const item = await shopItemService.getById(itemId);
            if (item && item.active) {
                const resolvedReturnUrl = state
                    ? (appConfig.SERVER_URL + '/paypal/return?state=' + encodeURIComponent(state))
                    : undefined;
                const resolvedCancelUrl = state
                    ? (appConfig.SERVER_URL + '/paypal/cancel?state=' + encodeURIComponent(state))
                    : undefined;

                const payment = await paypalService.createPayment(user, item, resolvedReturnUrl, resolvedCancelUrl);
                const order = new ShopOrder();
                order.paypalPaymentId = payment.id;
                if (state) {
                    order.paypalState = state;
                }
                order.user = user;
                order.shopItem = item;
                order.paypalPaymentRequest = payment;
                await order.save();
                return payment.links.find(link => link.rel == 'approval_url').href;
            }
        }
    }

    public static async createGiftPayPalOrderCore(
        shopItemService: ShopItemService,
        paypalService: PaypalService,
        recipient: User,
        itemId: string,
        state: string,
        gift: GiftOrderDetails,
        returnTo?: string
    ) {
        if (!recipient || !itemId || !state) {
            throw new Error('Missing gift order parameters.');
        }

        const item = await shopItemService.getById(itemId);
        if (!item || !item.active) {
            throw new Error('Shop item is not available.');
        }

        const returnUrl = this.getAllowedReturnUrl(returnTo) || '';
        const returnParam = returnUrl ? '&returnTo=' + encodeURIComponent(returnUrl) : '';
        const payment = await paypalService.createPayment(
            recipient,
            item,
            appConfig.SERVER_URL + '/paypal/return?state=' + encodeURIComponent(state) + returnParam,
            appConfig.SERVER_URL + '/paypal/cancel?state=' + encodeURIComponent(state) + returnParam
        );
        const order = new ShopOrder();
        order.paypalPaymentId = payment.id;
        order.paypalState = state;
        order.user = recipient;
        order.shopItem = item;
        order.paypalPaymentRequest = payment;
        this.applyGiftDetails(order, gift);
        await order.save();
        return payment.links.find(link => link.rel == 'approval_url').href;
    }

    public static async confirmOrderCore(
        shopOrderService: ShopOrderService,
        paypalService: PaypalService,
        user: any,
        paypalPaymentId: string,
        paypalPlayerId: string
    ): Promise<Date> {
        const order = await shopOrderService.getFirstByAttribute('paypalPaymentId', paypalPaymentId, ['user', 'shopItem']);
        if (!order) {
            throw new Error('Order not found! ' + paypalPaymentId);
        } else if (order.user.id != user.id) {
            throw new Error('Order created by other user! ' + paypalPaymentId);
        } else if (order.paypalPaymentResponse) {
            if ((order.paypalPaymentResponse as any).state == 'approved') {
                return order.user.planUntil;
            } else {
                throw new Parse.Error(100, 'The transaction was not successfully completed. Please contact our support if this was unintended.');
            }
        } else {
            let response;
            try {
                response = await paypalService.executePayment(paypalPaymentId, paypalPlayerId);
            } catch (e: any) {
                response = e.response;
            }

            order.paypalPaymentResponse = response;
            if (response?.state === 'approved') {
                order.paidAt = new Date();
            }
            await order.save();
            if (response.state == 'approved') {
                return this.applyPlan(order);
            } else {
                throw new Parse.Error(100, 'The transaction was not successfully completed. Please contact our support if this was unintended.');
            }
        }
    }

    public static async createStripeCheckoutCore(
        shopItemService: ShopItemService,
        stripeService: StripeService,
        user: any,
        itemId: string,
        state: string,
        returnTo?: string
    ) {
        if (!user || !itemId || !state) {
            throw new Error('Missing Stripe checkout parameters.');
        }

        const item = await shopItemService.getById(itemId);
        if (!item || !item.active) {
            throw new Error('Shop item is not available.');
        }

        const returnUrl = this.getAllowedReturnUrl(returnTo) || '';
        const returnParam = returnUrl ? '&returnTo=' + encodeURIComponent(returnUrl) : '';
        const successUrl = appConfig.SERVER_URL + '/stripe/return?state=' + encodeURIComponent(state) +
            '&session_id={CHECKOUT_SESSION_ID}' + returnParam;
        const cancelUrl = appConfig.SERVER_URL + '/stripe/cancel?state=' + encodeURIComponent(state) + returnParam;
        const checkout = await stripeService.createCheckoutSession(user, item, state, successUrl, cancelUrl);
        if (!checkout?.id || !checkout?.url) {
            throw new Error(checkout?.error?.message || 'Stripe checkout session could not be created.');
        }

        const order = new ShopOrder();
        order.stripeSessionId = checkout.id;
        order.stripeState = state;
        order.user = user;
        order.shopItem = item;
        order.stripeCheckoutRequest = {
            state,
            returnTo: returnUrl,
            itemId
        };
        order.stripeCheckoutResponse = checkout;
        await order.save();
        return checkout.url;
    }

    public static async createGiftStripeCheckoutCore(
        shopItemService: ShopItemService,
        stripeService: StripeService,
        recipient: User,
        itemId: string,
        state: string,
        gift: GiftOrderDetails,
        returnTo?: string
    ) {
        if (!recipient || !itemId || !state) {
            throw new Error('Missing gift checkout parameters.');
        }

        const item = await shopItemService.getById(itemId);
        if (!item || !item.active) {
            throw new Error('Shop item is not available.');
        }

        const returnUrl = this.getAllowedReturnUrl(returnTo) || '';
        const returnParam = returnUrl ? '&returnTo=' + encodeURIComponent(returnUrl) : '';
        const successUrl = appConfig.SERVER_URL + '/stripe/return?state=' + encodeURIComponent(state) +
            '&session_id={CHECKOUT_SESSION_ID}' + returnParam;
        const cancelUrl = appConfig.SERVER_URL + '/stripe/cancel?state=' + encodeURIComponent(state) + returnParam;
        const checkout = await stripeService.createCheckoutSession(recipient, item, state, successUrl, cancelUrl);
        if (!checkout?.id || !checkout?.url) {
            throw new Error(checkout?.error?.message || 'Stripe checkout session could not be created.');
        }

        const order = new ShopOrder();
        order.stripeSessionId = checkout.id;
        order.stripeState = state;
        order.user = recipient;
        order.shopItem = item;
        order.stripeCheckoutRequest = {
            state,
            returnTo: returnUrl,
            itemId,
            gift
        };
        order.stripeCheckoutResponse = checkout;
        this.applyGiftDetails(order, gift);
        await order.save();
        return checkout.url;
    }

    public static async confirmStripeCheckoutCore(
        shopOrderService: ShopOrderService,
        stripeService: StripeService,
        state: string,
        sessionId?: string
    ): Promise<Date> {
        const order = await shopOrderService.getFirstByAttribute('stripeState' as any, state, ['user', 'shopItem']);
        if (!order) {
            throw new Error('Order not found for Stripe state.');
        }

        if (order.paidAt) {
            return order.user.planUntil;
        }

        const resolvedSessionId = sessionId || order.stripeSessionId;
        if (!resolvedSessionId || resolvedSessionId !== order.stripeSessionId) {
            throw new Error('Invalid Stripe checkout session.');
        }

        const session = await stripeService.retrieveCheckoutSession(resolvedSessionId);
        order.stripeCheckoutResponse = session;
        if (session?.payment_status === 'paid' || session?.status === 'complete') {
            order.paidAt = new Date();
            await order.save();
            return this.applyPlan(order);
        }

        await order.save();
        throw new Parse.Error(100, 'The Stripe transaction is not paid yet.');
    }

    private static async applyPlan(order: ShopOrder): Promise<Date> {
        let newPlanUntil = order.user.planUntil;
        if (!newPlanUntil || newPlanUntil < new Date()) {
            newPlanUntil = new Date();
        }
        newPlanUntil.setDate(newPlanUntil.getDate() + order.shopItem.days);
        order.user.plan = EUserPlan.PRO;
        order.user.planUntil = newPlanUntil;
        if (order.giftProvider) {
            const receivedGifts = (order.user.receivedGifts || []).filter(gift => gift.orderId !== order.id);
            receivedGifts.unshift({
                orderId: order.id,
                days: order.shopItem.days,
                sender: order.giftSenderName || 'A viewer',
                message: order.giftMessage || '',
                provider: order.giftProvider,
                handle: order.giftRecipientHandle,
                paidAt: (order.paidAt || new Date()).toISOString()
            });
            order.user.receivedGifts = receivedGifts.slice(0, 25);
        }
        await order.user.save();
        return order.user.planUntil;
    }

    private static applyGiftDetails(order: ShopOrder, gift: GiftOrderDetails) {
        order.giftProvider = gift.provider;
        order.giftRecipientHandle = gift.recipientHandle;
        order.giftSenderName = this.cleanGiftText(gift.senderName, 80) || 'A viewer';
        order.giftMessage = this.cleanGiftText(gift.message, 240);
    }

    private static cleanGiftText(value: string, maxLength: number) {
        return String(value || '').replace(/\s+/g, ' ').trim().slice(0, maxLength);
    }

    private static getAllowedReturnUrl(returnTo?: string): string {
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

    constructor() {
        super('ShopOrderCloud');
        this.registerMethod('createOrder', this.createOrder);
        this.registerMethod('confirmOrder', this.confirmOrder);
        this.registerMethod('createStripeCheckout', this.createStripeCheckout);
    }

    public async createOrder(user, itemId, state?: string) {
        return ShopOrderCloud.createOrderCore(this.shopItemService, this.paypalService, user, itemId, state);
    }

    public async confirmOrder(user, paypalPaymentId, paypalPlayerId) {
        return ShopOrderCloud.confirmOrderCore(this.shopOrderService, this.paypalService, user, paypalPaymentId, paypalPlayerId);
    }

    public async createStripeCheckout(user, itemId: string, state: string, returnTo?: string) {
        return ShopOrderCloud.createStripeCheckoutCore(this.shopItemService, this.stripeService, user, itemId, state, returnTo);
    }
}
BaseCloud.register(ShopOrderCloud);

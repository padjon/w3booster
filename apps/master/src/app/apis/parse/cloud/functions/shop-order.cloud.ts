import { BaseCloud } from './base/base-cloud';
import { ServiceManager, PaypalService } from 'app/data/services';
import { ShopItemService, ShopOrderService } from 'app/data/modelservices';
import { ShopItem, User, ShopOrder, EUserPlan } from 'app/data/models';
import { appConfig } from 'app/config';

export class ShopOrderCloud extends BaseCloud {
    private shopItemService = ServiceManager.get(ShopItemService);
    private shopOrderService = ServiceManager.get(ShopOrderService);
    private paypalService = ServiceManager.get(PaypalService);

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
                let newPlanUntil = order.user.planUntil;
                if (!newPlanUntil || newPlanUntil < new Date()) {
                    newPlanUntil = new Date();
                }
                newPlanUntil.setDate(newPlanUntil.getDate() + order.shopItem.days);
                order.user.plan = EUserPlan.PRO;
                order.user.planUntil = newPlanUntil;
                order.user.save();
                return order.user.planUntil;
            } else {
                throw new Parse.Error(100, 'The transaction was not successfully completed. Please contact our support if this was unintended.');
            }
        }
    }

    constructor() {
        super('ShopOrderCloud');
        this.registerMethod('createOrder', this.createOrder);
        this.registerMethod('confirmOrder', this.confirmOrder);
    }

    public async createOrder(user, itemId, state?: string) {
        return ShopOrderCloud.createOrderCore(this.shopItemService, this.paypalService, user, itemId, state);
    }

    public async confirmOrder(user, paypalPaymentId, paypalPlayerId) {
        return ShopOrderCloud.confirmOrderCore(this.shopOrderService, this.paypalService, user, paypalPaymentId, paypalPlayerId);
    }
}
BaseCloud.register(ShopOrderCloud);

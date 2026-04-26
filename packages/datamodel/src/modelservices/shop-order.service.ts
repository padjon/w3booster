import { ErrorService, ParseService } from '../services';
import { ShopOrder } from '../models';
import { BaseModelService } from './base/base-modelservice';
import { Injectable } from '@angular/core';


@Injectable()
export class ShopOrderService extends BaseModelService<ShopOrder> {

    constructor(errorService: ErrorService, parseService: ParseService) {
        super(errorService, parseService, ShopOrder);
    }

    public CreateOrder(productId: string, state?: string): Promise<string> {
        return this.runCloudMethod('ShopOrderCloud.createOrder', [...Array.from(arguments)]);
    }

    public ConfirmOrder(paypalPaymentId: string, PaypalPayerId): Promise<string> {
        return this.runCloudMethod('ShopOrderCloud.confirmOrder', [...Array.from(arguments)]);
    }
}

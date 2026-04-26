import { BaseModel } from './base';
import { ShopItem } from './shop-item';
import { User } from './user';

export class ShopOrder extends BaseModel {
    public static PARSE_CLASSNAME = 'ShopOrder';
    private _product: ShopItem;
    private _user: User;
    private _shopItem: ShopItem;
    private _paypalPaymentId: string;
    private _paypalPaymentRequest: Object;
    private _paypalPaymentResponse: Object;
    private _paypalState: string;
    private _paypalCancelledAt: Date;
    private _stripeSessionId: string;
    private _stripeState: string;
    private _stripeCheckoutRequest: Object;
    private _stripeCheckoutResponse: Object;
    private _stripeCancelledAt: Date;
    private _paidAt: Date;
    private _giftRecipientHandle: string;
    private _giftSenderName: string;
    private _giftMessage: string;
    private _giftProvider: 'paypal' | 'stripe';

    constructor() {
        super(ShopOrder.PARSE_CLASSNAME);
    }

    /**
     * Getter product
     * @return {ShopItem}
     */
    public get product(): ShopItem {
        return this._product;
    }

    /**
     * Getter user
     * @return {User}
     */
    public get user(): User {
        return this._user;
    }

    /**
     * Getter shopItem
     * @return {ShopItem}
     */
    public get shopItem(): ShopItem {
        return this._shopItem;
    }

    /**
     * Getter paypalPaymentId
     * @return {string}
     */
    public get paypalPaymentId(): string {
        return this._paypalPaymentId;
    }

    /**
     * Getter paypalPaymentRequest
     * @return {Object}
     */
    public get paypalPaymentRequest(): Object {
        return this._paypalPaymentRequest;
    }

    /**
     * Getter paypalPaymentResponse
     * @return {Object}
     */
    public get paypalPaymentResponse(): Object {
        return this._paypalPaymentResponse;
    }

    public get paypalState(): string {
        return this._paypalState;
    }

    public get paypalCancelledAt(): Date {
        return this._paypalCancelledAt;
    }

    public get stripeSessionId(): string {
        return this._stripeSessionId;
    }

    public get stripeState(): string {
        return this._stripeState;
    }

    public get stripeCheckoutRequest(): Object {
        return this._stripeCheckoutRequest;
    }

    public get stripeCheckoutResponse(): Object {
        return this._stripeCheckoutResponse;
    }

    public get stripeCancelledAt(): Date {
        return this._stripeCancelledAt;
    }

    /**
     * Getter paidAt
     * @return {Date}
     */
    public get paidAt(): Date {
        return this._paidAt;
    }

    public get giftRecipientHandle(): string {
        return this._giftRecipientHandle;
    }

    public get giftSenderName(): string {
        return this._giftSenderName;
    }

    public get giftMessage(): string {
        return this._giftMessage;
    }

    public get giftProvider(): 'paypal' | 'stripe' {
        return this._giftProvider;
    }

    /**
     * Setter product
     * @param {ShopItem} value
     */
    public set product(value: ShopItem) {
        this._product = value;
    }

    /**
     * Setter user
     * @param {User} value
     */
    public set user(value: User) {
        this._user = value;
    }

    /**
     * Setter shopItem
     * @param {ShopItem} value
     */
    public set shopItem(value: ShopItem) {
        this._shopItem = value;
    }

    /**
     * Setter paypalPaymentId
     * @param {string} value
     */
    public set paypalPaymentId(value: string) {
        this._paypalPaymentId = value;
    }

    /**
     * Setter paypalPaymentRequest
     * @param {Object} value
     */
    public set paypalPaymentRequest(value: Object) {
        this._paypalPaymentRequest = value;
    }

    /**
     * Setter paypalPaymentResponse
     * @param {Object} value
     */
    public set paypalPaymentResponse(value: Object) {
        this._paypalPaymentResponse = value;
    }

    public set paypalState(value: string) {
        this._paypalState = value;
    }

    public set paypalCancelledAt(value: Date) {
        this._paypalCancelledAt = value;
    }

    public set stripeSessionId(value: string) {
        this._stripeSessionId = value;
    }

    public set stripeState(value: string) {
        this._stripeState = value;
    }

    public set stripeCheckoutRequest(value: Object) {
        this._stripeCheckoutRequest = value;
    }

    public set stripeCheckoutResponse(value: Object) {
        this._stripeCheckoutResponse = value;
    }

    public set stripeCancelledAt(value: Date) {
        this._stripeCancelledAt = value;
    }

    /**
     * Setter paidAt
     * @param {Date} value
     */
    public set paidAt(value: Date) {
        this._paidAt = value;
    }

    public set giftRecipientHandle(value: string) {
        this._giftRecipientHandle = value;
    }

    public set giftSenderName(value: string) {
        this._giftSenderName = value;
    }

    public set giftMessage(value: string) {
        this._giftMessage = value;
    }

    public set giftProvider(value: 'paypal' | 'stripe') {
        this._giftProvider = value;
    }

}

BaseModel.registerClass(ShopOrder, ShopOrder.PARSE_CLASSNAME);

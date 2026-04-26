import { MatchParticipant } from './match-participant';
import { BaseModel } from './base';

export class ShopItem extends BaseModel {
    public static PARSE_CLASSNAME = 'ShopItem';
    private _description: string;
    private _price: number;
    private _days: number;
    private _active: boolean;

    constructor() {
        super(ShopItem.PARSE_CLASSNAME);
    }


    /**
     * Getter description
     * @return {string}
     */
    public get description(): string {
        return this._description;
    }

    /**
     * Getter price
     * @return {number}
     */
    public get price(): number {
        return this._price;
    }

    /**
     * Getter days
     * @return {number}
     */
    public get days(): number {
        return this._days;
    }

    /**
     * Getter active
     * @return {boolean}
     */
    public get active(): boolean {
        return this._active;
    }

    /**
     * Setter description
     * @param {string} value
     */
    public set description(value: string) {
        this._description = value;
    }

    /**
     * Setter price
     * @param {number} value
     */
    public set price(value: number) {
        this._price = value;
    }

    /**
     * Setter days
     * @param {number} value
     */
    public set days(value: number) {
        this._days = value;
    }

    /**
     * Setter active
     * @param {boolean} value
     */
    public set active(value: boolean) {
        this._active = value;
    }

}

BaseModel.registerClass(ShopItem, ShopItem.PARSE_CLASSNAME);

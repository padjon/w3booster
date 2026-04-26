import { BaseModel } from 'app/data/common/models/base';

export class PaypalCallback extends BaseModel {
    public static PARSE_CLASSNAME = 'PaypalCallback';
    private _value: Object;
    private _isSandbox: boolean;

    constructor() {
        super(PaypalCallback.PARSE_CLASSNAME);
    }


    /**
     * Getter value
     * @return {Object}
     */
    public get value(): Object {
        return this._value;
    }

    /**
     * Setter value
     * @param {Object} value
     */
    public set value(value: Object) {
        this._value = value;
    }


    /**
     * Getter isSandbox
     * @return {boolean}
     */
    public get isSandbox(): boolean {
        return this._isSandbox;
    }

    /**
     * Setter isSandbox
     * @param {boolean} value
     */
    public set isSandbox(value: boolean) {
        this._isSandbox = value;
    }

}

BaseModel.registerClass(PaypalCallback, PaypalCallback.PARSE_CLASSNAME);

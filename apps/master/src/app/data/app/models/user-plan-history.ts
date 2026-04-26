import { BaseModel } from 'app/data/common/models/base';
import { User } from 'app/data/models';
import { EUserPlan } from 'app/data/common/models';

export class UserPlanHistory extends BaseModel {
    public static PARSE_CLASSNAME = 'UserPlanHistory';
    private _user: User;
    private _oldPlan: EUserPlan;
    private _newPlan: EUserPlan;
    private _oldPlanUntil: Date;
    private _newPlanUntil: Date;

    constructor() {
        super(UserPlanHistory.PARSE_CLASSNAME);
    }

    /**
     * Getter user
     * @return {User}
     */
    public get user(): User {
        return this._user;
    }

    /**
     * Getter oldPlan
     * @return {EUserPlan}
     */
    public get oldPlan(): EUserPlan {
        return this._oldPlan;
    }

    /**
     * Getter newPlan
     * @return {EUserPlan}
     */
    public get newPlan(): EUserPlan {
        return this._newPlan;
    }

    /**
     * Getter oldPlanUntil
     * @return {Date}
     */
    public get oldPlanUntil(): Date {
        return this._oldPlanUntil;
    }

    /**
     * Getter newPlanUntil
     * @return {Date}
     */
    public get newPlanUntil(): Date {
        return this._newPlanUntil;
    }

    /**
     * Setter user
     * @param {User} value
     */
    public set user(value: User) {
        this._user = value;
    }

    /**
     * Setter oldPlan
     * @param {EUserPlan} value
     */
    public set oldPlan(value: EUserPlan) {
        this._oldPlan = value;
    }

    /**
     * Setter newPlan
     * @param {EUserPlan} value
     */
    public set newPlan(value: EUserPlan) {
        this._newPlan = value;
    }

    /**
     * Setter oldPlanUntil
     * @param {Date} value
     */
    public set oldPlanUntil(value: Date) {
        this._oldPlanUntil = value;
    }

    /**
     * Setter newPlanUntil
     * @param {Date} value
     */
    public set newPlanUntil(value: Date) {
        this._newPlanUntil = value;
    }
}

BaseModel.registerClass(UserPlanHistory, UserPlanHistory.PARSE_CLASSNAME);

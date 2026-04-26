import { BaseModel, Parse } from './base';
import { OverlaySettings } from './overlay-settings';
import { EventsystemConfig, EEventsystemConfigRuleTriggerType, EEventsystemConfigTarget } from './eventsystem-config';

export enum EUserSettingEnum {
    UPDATE_MATCH_SCORE_AUTOMATICALLY = 'UPDATE_MATCH_SCORE_AUTOMATICALLY',
}

export enum EUserPlan {
    BASIC,
    PRO
}

export enum EUserLogLevel {
    DEFAULT,
    ALL
}

interface AuthData { 'twitch': { id: number, access_token: string }; }
interface TwitchUserData { id: string; login: string; display_name: string; type: string; broadcaster_type: string; description: string; profile_image_url: string; offile_image_url: string; view_cont: number; email: string; }

export interface ConnectedAccount {
    provider: 'twitch' | 'battlenet';
    id: string;
    login?: string;
    displayName?: string;
    avatarUrl?: string;
    email?: string;
    connectedAt: string;
}

export interface ReceivedGift {
    orderId: string;
    days: number;
    sender: string;
    message?: string;
    provider: 'paypal' | 'stripe';
    handle?: string;
    paidAt: string;
}

export interface DiscordUserData { id: string; username: string; }

export class User extends Parse.User {
    public static PARSE_CLASSNAME = '_User';
    public static PARSE_CLASSNAME2 = 'User';

    private _id: string;
    private _email: string;
    private _username: string;
    private _displayName: string;
    private _plan: EUserPlan;
    private _planUntil: Date;
    private _planBeforeEvent: Date;
    private _logLevel: EUserLogLevel;
    private _broadcasterSecret: string;
    private _authData: AuthData;
    private _twitchUserData: TwitchUserData;
    private _discordUserData: DiscordUserData;
    private _connectedAccounts: ConnectedAccount[];
    private _connectedTwitchIds: string[];
    private _connectedTwitchLogins: string[];
    private _connectedBattleNetIds: string[];
    private _receivedGifts: ReceivedGift[];
    private _settings: { [index: string]: any };
    private _playerOverlaySettings: OverlaySettings;
    private _obsOverlaySettings: OverlaySettings;
    private _eventsystemConfigs: { [target: number]: EventsystemConfig };

    constructor() {
        super();
        BaseModel.initParseObject(this);

        this._settings = {};
        this._connectedAccounts = [];
        this._connectedTwitchIds = [];
        this._connectedTwitchLogins = [];
        this._connectedBattleNetIds = [];
        this._receivedGifts = [];
        this._playerOverlaySettings = new OverlaySettings();
        this._obsOverlaySettings = new OverlaySettings();
        this._eventsystemConfigs = {};
        this._eventsystemConfigs[EEventsystemConfigTarget.OBS] = undefined;
        this._eventsystemConfigs[EEventsystemConfigTarget.STREAMLABS] = undefined;
        this._eventsystemConfigs[EEventsystemConfigTarget.XSPLIT] = undefined;
        this._plan = EUserPlan.BASIC;
        this._logLevel = EUserLogLevel.DEFAULT;
    }


    //@ts-ignore
    public get id(): string {
        return this._id;
    }

    public set id(value: string) {
        this._id = value;
    }

    public get username(): string {
        return this._username;
    }

    public set username(value: string) {
        this._username = value;
    }

    public get displayName(): string {
        return this._displayName;
    }

    public set displayName(value: string) {
        this._displayName = value;
    }

    /**
     * Getter logLevel
     * @return {EUserLogLevel}
     */
    public get logLevel(): EUserLogLevel {
        return this._logLevel;
    }

    /**
     * Setter logLevel
     * @param {EUserLogLevel} value
     */
    public set logLevel(value: EUserLogLevel) {
        this._logLevel = value;
    }

    /**
     * Setter overlaySettings
     * @param {OverlaySettings} value
     */
    public set playerOverlaySettings(value: OverlaySettings) {
        this._playerOverlaySettings = value;
    }

    /**
     * Setter overlaySettings
     * @param {OverlaySettings} value
     */
    public set obsOverlaySettings(value: OverlaySettings) {
        this._obsOverlaySettings = value;
    }

    public get broadcasterSecret(): string {
        return this._broadcasterSecret;
    }

    public set broadcasterSecret(value: string) {
        this._broadcasterSecret = value;
    }

    public get email(): string {
        return this._email;
    }

    public set email(value: string) {
        this._email = value;
    }

    public get twitchUserData(): TwitchUserData {
        return this._twitchUserData;
    }

    public set twitchUserData(value: TwitchUserData) {
        this._twitchUserData = value;
    }

    public get authData(): AuthData {
        return this._authData;
    }

    public set authData(value: AuthData) {
        this._authData = value;
    }

    public get discordUserData(): DiscordUserData {
        return this._discordUserData;
    }

    public set discordUserData(value: DiscordUserData) {
        this._discordUserData = value;
    }

    public get connectedAccounts(): ConnectedAccount[] {
        return this._connectedAccounts || [];
    }

    public set connectedAccounts(value: ConnectedAccount[]) {
        this._connectedAccounts = value || [];
    }

    public get connectedTwitchIds(): string[] {
        return this._connectedTwitchIds || [];
    }

    public set connectedTwitchIds(value: string[]) {
        this._connectedTwitchIds = value || [];
    }

    public get connectedTwitchLogins(): string[] {
        return this._connectedTwitchLogins || [];
    }

    public set connectedTwitchLogins(value: string[]) {
        this._connectedTwitchLogins = value || [];
    }

    public get connectedBattleNetIds(): string[] {
        return this._connectedBattleNetIds || [];
    }

    public set connectedBattleNetIds(value: string[]) {
        this._connectedBattleNetIds = value || [];
    }

    public get receivedGifts(): ReceivedGift[] {
        return this._receivedGifts || [];
    }

    public set receivedGifts(value: ReceivedGift[]) {
        this._receivedGifts = value || [];
    }

    public get playerOverlaySettings(): OverlaySettings {
        return this._playerOverlaySettings;
    }

    public get obsOverlaySettings(): OverlaySettings {
        return this._obsOverlaySettings;
    }

    public get plan(): EUserPlan {
        return this._plan;
    }

    public set plan(value: EUserPlan) {
        this._plan = value;
    }


    /**
     * Getter planBeforeEvent
     * @return {Date}
     */
    public get planBeforeEvent(): Date {
        return this._planBeforeEvent;
    }

    /**
     * Setter planBeforeEvent
     * @param {Date} value
     */
    public set planBeforeEvent(value: Date) {
        this._planBeforeEvent = value;
    }


    public get planUntil(): Date {
        return this._planUntil;
    }

    public set planUntil(value: Date) {
        this._planUntil = value;
    }

    public get eventsystemConfigs(): { [target: number]: EventsystemConfig } {
        return this._eventsystemConfigs;
    }

    public set eventsystemConfigs(value: { [target: number]: EventsystemConfig }) {
        this._eventsystemConfigs = value;
    }

    public save(): Promise<this> {
        return BaseModel.save(this, super.save);
    }

    private _setExisted(isExisted: boolean) {
        BaseModel.setExisted(this, isExisted, super['_setExisted']);
    }

    public get settings(): { [index: string]: any } {
        return this._settings;
    }

    public setSetting(key: EUserSettingEnum, value: any, save = false) {
        if (!this._settings) {
            this._settings = {};
        }
        this._settings[String(key)] = value;
        if (save) {
            this.save();
        }
    }

    public getSetting<T>(key: EUserSettingEnum, defaultValue: T): T {
        if (!this._settings) {
            this._settings = {};
        }

        const value = this._settings[String(key)];
        return ((value !== undefined) ? value : defaultValue) as T;
    }

    public isProPlan() {
        return this.plan === EUserPlan.PRO;
    }

    public getResumingProPlanDays() {
        if (!this.isProPlan()) {
            return 0;
        } else {
            const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
            const firstDate = new Date();
            const secondDate = this.planUntil;
            return Math.max(0, Math.round(Math.abs((firstDate.getTime() - secondDate.getTime()) / oneDay)));
        }
    }

    public unsetTypeSave(field: keyof this) {
        this.unset(field as string);
    }

    public unset(field: string) {
        delete this["_" + (field as string)];
        return super.unset(field);
    }
}

BaseModel.registerClass(User, User.PARSE_CLASSNAME);
BaseModel.registerClass(User, User.PARSE_CLASSNAME2);

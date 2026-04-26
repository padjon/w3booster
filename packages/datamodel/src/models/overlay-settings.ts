import { BaseModel, Parse } from './base';

export enum EClassCategory {
    MATCHUP_BAR = 'MATCHUP_BAR'
}

export class OverlaySettings extends BaseModel {
    public static PARSE_CLASSNAME = 'OverlaySettings';

    private _username: string;
    private _headlineTop: string;
    private _headlineBot: string;
    private _headlineTopIsMainHeadline: boolean;
    private _nationality: string;
    private _topBarEnabled: boolean;
    private _additionalCSSClasses: Map<EClassCategory, string>;
    private _topBarStatisticsOfMeEnabled: boolean;
    private _topBarStatisticsOfOpponentEnabled: boolean;
    private _topBarGameDurationEnabled: boolean;
    private _topBarPlayerColorsEnabled: boolean;
    private _topBarPlayerColorsEnabledIn1V1: boolean;
    private _heroAbilitiesEnabled: boolean;
    private _heroItemsEnabled: boolean;
    private _heroExpProgressEnabled: boolean;
    private _heroLevelEnabled: boolean;
    private _browserSourceEnabled: boolean;
    private _ingameOverlayEnabled: boolean;
    private _researchesEnabled: boolean;
    private _researchesOfAttackAndArmorEnabled: boolean;
    private _researchesShowAllEnabled: boolean;
    private _researchesInQueueEnabled: boolean;
    private _mapBarEnabled: boolean;
    private _mapNameEnabled: boolean;
    private _matchscoreEnabled: boolean;
    private _matchscoreEnabledInReplay: boolean;
    private _controlgroupsEnabled: boolean;
    private _showRacesOnlyTextual: boolean;
    private _reversePlayerOrder: boolean;

    constructor() {
        super(OverlaySettings.PARSE_CLASSNAME);
        this.topBarEnabled = true;
        this.topBarStatisticsOfMeEnabled = true;
        this.topBarStatisticsOfOpponentEnabled = true;
        this.topBarGameDurationEnabled = true;
        this.topBarPlayerColorsEnabled = true;
        this.topBarPlayerColorsEnabledIn1V1 = true;
        this.heroAbilitiesEnabled = true;
        this.heroItemsEnabled = true;
        this.heroExpProgressEnabled = true;
        this.heroLevelEnabled = true;
        this.browserSourceEnabled = true;
        this.ingameOverlayEnabled = true;
        this.researchesEnabled = true;
        this.researchesOfAttackAndArmorEnabled = true;
        this.researchesShowAllEnabled = false;
        this.researchesInQueueEnabled = true;
        this.mapBarEnabled = true;
        this.mapNameEnabled = true;
        this.matchscoreEnabled = true;
        this.matchscoreEnabledInReplay = false;
        this.controlgroupsEnabled = true;
        this.additionalCSSClasses = new Map<EClassCategory, string>();
        this.additionalCSSClasses[EClassCategory.MATCHUP_BAR] = 'MatchupBarIsTopLeft';
        this.headlineTop = 'overlay provided by';
        this.headlineBot = 'W3Booster.com';
        this.headlineTopIsMainHeadline = false;
        this.showRacesOnlyTextual = false;
        this.reversePlayerOrder = false;
    }

    public get reversePlayerOrder(): boolean {
        return this._reversePlayerOrder;
    }

    public set reversePlayerOrder(value: boolean) {
        this._reversePlayerOrder = value;
    }

    public get headlineTopIsMainHeadline(): boolean {
        return this._headlineTopIsMainHeadline;
    }

    public set headlineTopIsMainHeadline(value: boolean) {
        this._headlineTopIsMainHeadline = value;
    }

    public get showRacesOnlyTextual(): boolean {
        return this._showRacesOnlyTextual;
    }

    public set showRacesOnlyTextual(value: boolean) {
        this._showRacesOnlyTextual = value;
    }

    /**
     * Getter headlineTop
     * @return {string}
     */
    public get headlineTop(): string {
        return this._headlineTop;
    }

    /**
     * Getter headlineBot
     * @return {string}
     */
    public get headlineBot(): string {
        return this._headlineBot;
    }

    /**
     * Setter headlineTop
     * @param {string} value
     */
    public set headlineTop(value: string) {
        this._headlineTop = value;
    }

    /**
     * Setter headlineBot
     * @param {string} value
     */
    public set headlineBot(value: string) {
        this._headlineBot = value;
    }


    /**
     * Getter ingameOverlayEnabled
     * @return {boolean}
     */
    public get ingameOverlayEnabled(): boolean {
        return this._ingameOverlayEnabled;
    }

    public get browserSourceEnabled(): boolean {
        return this._browserSourceEnabled;
    }

    /**
     * Setter ingameOverlayEnabled
     * @param {boolean} value
     */
    public set ingameOverlayEnabled(value: boolean) {
        this._ingameOverlayEnabled = value;
    }

    public set browserSourceEnabled(value: boolean) {
        this._browserSourceEnabled = value;
    }

    /**
     * Getter mapBarEnabled
     * @return {boolean}
     */
    public get mapBarEnabled(): boolean {
        return this._mapBarEnabled;
    }

    /**
     * Getter matchscoreEnabled
     * @return {boolean}
     */
    public get matchscoreEnabled(): boolean {
        return this._matchscoreEnabled;
    }

    /**
     * Getter matchscoreEnabledInReplay
     * @return {boolean}
     */
    public get matchscoreEnabledInReplay(): boolean {
        return this._matchscoreEnabledInReplay;
    }

    /**
     * Setter mapBarEnabled
     * @param {boolean} value
     */
    public set mapBarEnabled(value: boolean) {
        this._mapBarEnabled = value;
    }

    /**
     * Setter matchscoreEnabled
     * @param {boolean} value
     */
    public set matchscoreEnabled(value: boolean) {
        this._matchscoreEnabled = value;
    }

    /**
     * Setter matchscoreEnabledInReplay
     * @param {boolean} value
     */
    public set matchscoreEnabledInReplay(value: boolean) {
        this._matchscoreEnabledInReplay = value;
    }

    /**
     * Getter username
     * @return {string}
     */
    public get username(): string {
        return this._username;
    }

    /**
     * Getter nationality
     * @return {string}
     */
    public get nationality(): string {
        return this._nationality;
    }

    /**
     * Getter topBarEnabled
     * @return {boolean}
     */
    public get topBarEnabled(): boolean {
        return this._topBarEnabled;
    }

    /**
     * Getter topBarStatisticsOfMeEnabled
     * @return {boolean}
     */
    public get topBarStatisticsOfMeEnabled(): boolean {
        return this._topBarStatisticsOfMeEnabled;
    }

    /**
     * Getter topBarStatisticsOfOpponentEnabled
     * @return {boolean}
     */
    public get topBarStatisticsOfOpponentEnabled(): boolean {
        return this._topBarStatisticsOfOpponentEnabled;
    }

    /**
     * Getter topBarGameDurationEnabled
     * @return {boolean}
     */
    public get topBarGameDurationEnabled(): boolean {
        return this._topBarGameDurationEnabled;
    }

    /**
     * Getter topBarPlayerColorsEnabled
     * @return {boolean}
     */
    public get topBarPlayerColorsEnabled(): boolean {
        return this._topBarPlayerColorsEnabled;
    }

    /**
     * Setter topBarPlayerColorsEnabled
     * @param {boolean} value
     */
    public set topBarPlayerColorsEnabled(value: boolean) {
        this._topBarPlayerColorsEnabled = value;
    }


    /**
     * Getter topBarPlayerColorsEnabledIn1V1
     * @return {boolean}
     */
    public get topBarPlayerColorsEnabledIn1V1(): boolean {
        return this._topBarPlayerColorsEnabledIn1V1;
    }

    /**
     * Setter topBarPlayerColorsEnabledIn1V1
     * @param {boolean} value
     */
    public set topBarPlayerColorsEnabledIn1V1(value: boolean) {
        this._topBarPlayerColorsEnabledIn1V1 = value;
    }


    /**
     * Getter heroExpProgressEnabled
     * @return {boolean}
     */
    public get heroExpProgressEnabled(): boolean {
        return this._heroExpProgressEnabled;
    }

    /**
     * Setter heroExpProgressEnabled
     * @param {boolean} value
     */
    public set heroExpProgressEnabled(value: boolean) {
        this._heroExpProgressEnabled = value;
    }

    /**
     * Getter heroLevelEnabled
     * @return {boolean}
     */
    public get heroLevelEnabled(): boolean {
        return this._heroLevelEnabled;
    }

    /**
     * Setter heroLevelEnabled
     * @param {boolean} value
     */
    public set heroLevelEnabled(value: boolean) {
        this._heroLevelEnabled = value;
    }


    /**
     * Getter heroAbilitiesEnabled
     * @return {boolean}
     */
    public get heroAbilitiesEnabled(): boolean {
        return this._heroAbilitiesEnabled;
    }

    /**
     * Getter heroItemsEnabled
     * @return {boolean}
     */
    public get heroItemsEnabled(): boolean {
        return this._heroItemsEnabled;
    }

    /**
     * Getter controlgroupsEnabled
     * @return {boolean}
     */
    public get controlgroupsEnabled(): boolean {
        return this._controlgroupsEnabled;
    }

    /**
     * Setter controlgroupsEnabled
     * @param {boolean} value
     */
    public set controlgroupsEnabled(value: boolean) {
        this._controlgroupsEnabled = value;
    }

    /**
     * Setter heroItemsEnabled
     * @param {boolean} value
     */
    public set heroItemsEnabled(value: boolean) {
        this._heroItemsEnabled = value;
    }

    /**
     * Getter researchesEnabled
     * @return {boolean}
     */
    public get researchesEnabled(): boolean {
        return this._researchesEnabled;
    }

    /**
     * Getter researchesOfAttackAndArmorEnabled
     * @return {boolean}
     */
    public get researchesOfAttackAndArmorEnabled(): boolean {
        return this._researchesOfAttackAndArmorEnabled;
    }

    /**
     * Getter researchesShowAllEnabled
     * @return {boolean}
     */
    public get researchesShowAllEnabled(): boolean {
        return this._researchesShowAllEnabled;
    }

    /**
     * Getter researchesInQueueEnabled
     * @return {boolean}
     */
    public get researchesInQueueEnabled(): boolean {
        return this._researchesInQueueEnabled;
    }

    /**
     * Getter mapNameEnabled
     * @return {boolean}
     */
    public get mapNameEnabled(): boolean {
        return this._mapNameEnabled;
    }

    public get additionalCSSClasses(): Map<EClassCategory, string> {
        return this._additionalCSSClasses;
    }

    /**
     * Setter username
     * @param {string} value
     */
    public set username(value: string) {
        this._username = value;
    }

    /**
     * Setter nationality
     * @param {string} value
     */
    public set nationality(value: string) {
        this._nationality = value;
    }

    /**
     * Setter topBarEnabled
     * @param {boolean} value
     */
    public set topBarEnabled(value: boolean) {
        this._topBarEnabled = value;
    }

    /**
     * Setter topBarStatisticsOfMeEnabled
     * @param {boolean} value
     */
    public set topBarStatisticsOfMeEnabled(value: boolean) {
        this._topBarStatisticsOfMeEnabled = value;
    }

    /**
     * Setter topBarStatisticsOfOpponentEnabled
     * @param {boolean} value
     */
    public set topBarStatisticsOfOpponentEnabled(value: boolean) {
        this._topBarStatisticsOfOpponentEnabled = value;
    }

    /**
     * Setter topBarGameDurationEnabled
     * @param {boolean} value
     */
    public set topBarGameDurationEnabled(value: boolean) {
        this._topBarGameDurationEnabled = value;
    }

    /**
     * Setter heroAbilitiesEnabled
     * @param {boolean} value
     */
    public set heroAbilitiesEnabled(value: boolean) {
        this._heroAbilitiesEnabled = value;
    }

    /**
     * Setter researchesEnabled
     * @param {boolean} value
     */
    public set researchesEnabled(value: boolean) {
        this._researchesEnabled = value;
    }

    /**
     * Setter researchesOfAttackAndArmorEnabled
     * @param {boolean} value
     */
    public set researchesOfAttackAndArmorEnabled(value: boolean) {
        this._researchesOfAttackAndArmorEnabled = value;
    }

    /**
     * Setter researchesShowAllEnabled
     * @param {boolean} value
     */
    public set researchesShowAllEnabled(value: boolean) {
        this._researchesShowAllEnabled = value;
    }

    /**
     * Setter researchesInQueueEnabled
     * @param {boolean} value
     */
    public set researchesInQueueEnabled(value: boolean) {
        this._researchesInQueueEnabled = value;
    }

    /**
     * Setter mapNameEnabled
     * @param {boolean} value
     */
    public set mapNameEnabled(value: boolean) {
        this._mapNameEnabled = value;
    }

    public set additionalCSSClasses(value: Map<EClassCategory, string>) {
        this._additionalCSSClasses = value;
    }

    public addCSSClass(cssClass: string, category?: string) {
        if (!category) {
            category = cssClass;
        }

        this.additionalCSSClasses[category] = cssClass;
    }

    public set removeCSSClass(cssClass: string) {
        for (const key of Array.from(this._additionalCSSClasses.keys())) {
            if (this._additionalCSSClasses.get(key) === cssClass) {
                this._additionalCSSClasses.delete(key);
            }
        }
    }

}

BaseModel.registerClass(OverlaySettings, OverlaySettings.PARSE_CLASSNAME);

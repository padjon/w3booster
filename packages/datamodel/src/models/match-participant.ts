import { BaseModel } from './base';

export class MatchParticipant {
    public static PARSE_CLASSNAME = 'MatchParticipant';
    private _name: string;

    constructor() {
    }


    /**
     * Getter name
     * @return {string}
     */
    public get name(): string {
        return this._name;
    }

    /**
     * Setter name
     * @param {string} value
     */
    public set name(value: string) {
        this._name = value;
    }


}

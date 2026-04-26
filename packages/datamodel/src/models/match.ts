import { MatchParticipant } from './match-participant';
import { BaseModel } from './base';

export class Match extends BaseModel {
    public static PARSE_CLASSNAME = 'Match';
    private _mapName: string;
    private _teams: Map<number, Array<MatchParticipant>>;
    private _winnerTeam: number;

    constructor() {
        super(Match.PARSE_CLASSNAME);
        this.teams = new Map();
    }


    /**
     * Getter mapName
     * @return {string}
     */
    public get mapName(): string {
        return this._mapName;
    }

    /**
     * Getter teams
     * @return {Map<number, Array<MatchParticipant>>}
     */
    public get teams(): Map<number, Array<MatchParticipant>> {
        return this._teams;
    }

    /**
     * Getter winnerTeam
     * @return {number}
     */
    public get winnerTeam(): number {
        return this._winnerTeam;
    }

    /**
     * Setter mapName
     * @param {string} value
     */
    public set mapName(value: string) {
        this._mapName = value;
    }

    /**
     * Setter teams
     * @param {Map<number, Array<MatchParticipant>>} value
     */
    public set teams(value: Map<number, Array<MatchParticipant>>) {
        this._teams = value;
    }

    /**
     * Setter winnerTeam
     * @param {number} value
     */
    public set winnerTeam(value: number) {
        this._winnerTeam = value;
    }


}

BaseModel.registerClass(Match, Match.PARSE_CLASSNAME);

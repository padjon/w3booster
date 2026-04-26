
import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { BaseComponent } from 'app/base.component';
import { EGameModeEnum, IPlayer, IPlayerStatsObject, ISettingsState, IGameState, IMiscState, raceNames, ERace } from 'app/data/models';

@Component({
    selector: 'app-matchbar',
    templateUrl: './matchbar.component.html',
    styleUrls: ['./matchbar.component.scss']
})
export class MatchbarComponent extends BaseComponent {

    public Number = Number;
    public EGameModeEnum = EGameModeEnum;
    public showMatchbar = false;
    public teams: Array<Array<IPlayer>>;
    public formattedGameTime = '';
    public additionalCSS = '';
    // public stats: { [playerId: number]: IPlayerStatsObject };
    public _settings: ISettingsState;
    public _game: IGameState;
    public raceNames = raceNames;

    @Input() misc: IMiscState;

    @Input() set gameTime(gameTime: number) {
        this.formattedGameTime = new Date(gameTime * 1000).toISOString().substr(14, 5);
    }

    @Input() set settings(setting: ISettingsState) {
        this._settings = setting;
        this.additionalCSS = '';
        if (this.settings) {
            if (this.settings.topBarStatisticsOfMeEnabled === false) {
                this.additionalCSS += 'options-no-streamer-stats ';
            }

            if (this.settings.topBarStatisticsOfOpponentEnabled === false || this.isBnetLadderFFA()) {
                this.additionalCSS += 'options-no-opponent-stats ';
            }

            if (this.game && this.game.gameMode !== EGameModeEnum.GM_1V1 && this.settings.topBarPlayerColorsEnabled === false) {
                this.additionalCSS += 'options-no-player-colors ';
            }

            if (this.game && this.game.gameMode === EGameModeEnum.GM_1V1 && this.settings.topBarPlayerColorsEnabledIn1V1 !== true) {
                this.additionalCSS += 'options-no-player-colors ';
            }
        }
    }

    get settings() {
        return this._settings;
    }

    private isBnetLadderFFA() {
        return this.game && this.game.gameMode === EGameModeEnum.GM_4FFA && this.game.isReplay !== true && this.game.isObserver !== true;
    }

    @Input() set game(game: IGameState) {
        const init = !Boolean(this._game);
        this._game = game;
        if (init) {
            this.settings = this.settings;
        }
        /*
        //make 4ffa to 3ffa for testing purposes
        while (this.game.players.length > 3) {
            this.game.players.pop();
            this.game.gameMode = EGameModeEnum.GM_3FFA;
        }

        // make 4ffa to 2on2 for testing purposes
        this.game.players[0].team = this.game.players[1].team;
        this.game.players[2].team = this.game.players[3].team;
        this.game.gameMode = EGameModeEnum.GM_2V2 as EGameModeEnum;
        */

        /*
        // make 3ffa to 3on3 for testing purposes
        this.game.players[4] = JSON.parse(JSON.stringify(this.game.players[3]));
        this.game.players[5] = JSON.parse(JSON.stringify(this.game.players[2]));
        this.game.players[0].team = this.game.players[1].team = this.game.players[2].team = 0;
        this.game.players[3].team = this.game.players[4].team = this.game.players[5].team = 1;
        this.game.gameMode = EGameModeEnum.GM_3V3 as EGameModeEnum;
        */

        /*
        // make 4ffa to 4on4 for testing purposes
        this.game.players[4] = JSON.parse(JSON.stringify(this.game.players[3]));
        this.game.players[5] = JSON.parse(JSON.stringify(this.game.players[2]));
        this.game.players[6] = JSON.parse(JSON.stringify(this.game.players[1]));
        this.game.players[7] = JSON.parse(JSON.stringify(this.game.players[0]));
        this.game.players[0].team = this.game.players[1].team = this.game.players[2].team = this.game.players[3].team  = 0;
        this.game.players[4].team = this.game.players[5].team = this.game.players[6].team = this.game.players[7].team  = 1;
        this.game.gameMode = EGameModeEnum.GM_4V4 as EGameModeEnum;
        */

        for (const player of Object.values(this.game.players)) {
            if (player.name.indexOf('#') >= 0) {
                player.name = player.name.substr(0, player.name.indexOf('#'));
            }
        }

        /*
        // add aliasses to all players
        for (const player of this.game.players) {
            if (!player.mainAccount) {
                player.mainAccount = { name: player.name, country: 'de' };
            }
        }*/

        /*
        let i = 0;
        for (const player of this.game.players) {
            if (i++ > 2) {
                delete player.mainAccount;
            }
        }*/

        this.showMatchbar = [EGameModeEnum.GM_1V1, EGameModeEnum.GM_2V2, EGameModeEnum.GM_4V4, EGameModeEnum.GM_3V3, EGameModeEnum.GM_3FFA, EGameModeEnum.GM_4FFA].indexOf(this.game.gameMode) >= 0;
        this.teams = new Array();
        if (this.game.players) {
            const playerTeam = this.game.players[this.game.broadcasterId].team;
            const teamIds = new Set([playerTeam]);
            Object.values(this.game.players).map(p => p.team).forEach(team => teamIds.add(team));
            for (const teamId of teamIds) {
                this.teams.push(Object.values(this.game.players).filter(p => p.team === teamId));
            }
        }
        /*
                this.stats = {};
                for (const player of Object.values(this.game.players)) {
                    if (player.stats) {
                        switch (this.game.gameMode) {
                            case EGameModeEnum.GM_3FFA:
                            case EGameModeEnum.GM_4FFA:
                                this.stats[player.id] = player.stats.ffa;
                                break;
                            case EGameModeEnum.GM_2V2:
                            case EGameModeEnum.GM_3V3:
                            case EGameModeEnum.GM_4V4:
                                this.stats[player.id] = player.stats.team;
                                break;
                            default:
                                this.stats[player.id] = player.stats.solo;
                                break;
                        }
                    }
                }*/
    }

    get game() {
        return this._game;
    }

    public getStats(player: IPlayer) {
        if (player.stats) {
            switch (this.game.gameMode) {
                case EGameModeEnum.GM_3FFA:
                case EGameModeEnum.GM_4FFA:
                    return player.stats.ffa;
                    break;
                case EGameModeEnum.GM_2V2:
                case EGameModeEnum.GM_3V3:
                    return player.stats.team;
                    break;
                case EGameModeEnum.GM_4V4:
                    return player.stats.team4;
                    break;
                default:
                    return player.stats.solo;
                    break;
            }
        } else {
            return player.stats;
        }
    }

    public getGameMode() {
        switch (this.game.gameMode) {
            case EGameModeEnum.GM_1V1:
                return '1vs1';
            case EGameModeEnum.GM_2V2:
                return '2vs2';
            default:
                return 'vs';
        }
    }

    public getColorCode(player: IPlayer) {
        if (this.misc.teamColors && (this.game.isReplay || this.game.isObserver !== true)) {
            if (player === this.game.players[this.game.broadcasterId]) {
                return '#0042ff';
            } else if (this.game.players[this.game.broadcasterId].team === player.team) {
                return '#1ce6b9';
            } else {
                return '#ff0303';
            }
        }

        switch (player.colorId) {
            case 0: return '#ff0303';
            case 1: return '#0042ff';
            case 2: return '#1ce6b9';
            case 3: return '#540081';
            case 4: return '#fffc00';
            case 5: return '#fe8a0e';
            case 6: return '#20c000';
            case 7: return '#e55bb0';
            case 8: return '#959697';
            case 9: return '#7ebff1';
            case 10: return '#106246';
            case 11: return '#4e2a04';
            case 12: return '#9b0000';
            case 13: return '#0000c3';
            case 14: return '#00eaff';
            case 15: return '#be00fe';
            case 16: return '#ebcd87';
            case 17: return '#f8a48b';
            case 18: return '#bfff80';
            case 19: return '#dcb9eb';
            case 20: return '#282828';
            case 21: return '#ebf0ff';
            case 22: return '#00781e';
            case 23: return '#a46f33';
        }
    }
}

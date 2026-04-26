
import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { BaseComponent } from 'app/base.component';
import { EGameModeEnum, IPlayer, EResource, IPlayerResources, ISettingsState, IGameState, IMiscState, raceNames, raceShortNames, IPlayerStateResources, IPlayerRessources } from 'app/data/models';

@Component({
    selector: 'app-obs-matchbar',
    templateUrl: './obs-matchbar.component.html',
    styleUrls: ['./obs-matchbar.component.scss']
})
export class ObsMatchbarComponent extends BaseComponent {

    public Number = Number;
    public Boolean = Boolean;
    public EResource = EResource;
    public EGameModeEnum = EGameModeEnum;
    public player1: IPlayer;
    public player2: IPlayer;
    public formattedGameTime = '';
    public _game: IGameState;
    public _resources: IPlayerStateResources;
    public _gameTime: number;
    public _settings: ISettingsState;
    public raceNames = raceNames;
    public raceShortNames = raceShortNames;

    @Input() misc: IMiscState;

    @Input() set gameTime(gameTime: number) {
        this._gameTime = gameTime;
        this.formattedGameTime = new Date(gameTime * 1000).toISOString().substr(14, 5).replace(/^00/, '0');
    }

    @Input() set settings(settings: ISettingsState) {
        this._settings = settings;
        this.setPlayers()
        console.warn("SET")
    }

    get settings() {
        return this._settings;
    }

    @Input() set game(game: IGameState) {
        this._game = game;
        for (const player of Object.values(this.game.players)) {
            if (player.name.indexOf('#') >= 0) {
                player.name = player.name.substr(0, player.name.indexOf('#'));
            }
        }
        this.setPlayers()
    }

    get game() {
        return this._game;
    }

    @Input() set resources(resources: IPlayerStateResources) {
        this._resources = resources;
    }

    get resources() {
        return this._resources;
    }

    private setPlayers() {
        if (this.game?.players) {
            const players = Object.values(this.game.players);
            this.player1 = players[0];
            this.player2 = players[1];

            if (this.player2.startPosition.x < this.player1.startPosition.x) {
                this.player1 = players[1];
                this.player2 = players[0];
            }

            if (this.settings?.reversePlayerOrder) {
                const temp = this.player1;
                this.player1 = this.player2;
                this.player2 = temp;
            }
        }
    }

    get player1Resources() {
        return this.resources &&this.resources[this.player1.id] ? this.resources[this.player1.id] : {};
    }

    get player2Resources() {
        return this.resources && this.resources[this.player2.id] ? this.resources[this.player2.id] : {};
    }

    public GetLastDayNightCylce() {
        return ((this.GetCurrentDayNightCylce() + 15) % 16);
    }

    public GetCurrentDayNightCylce() {
        return Math.floor(((this._gameTime + 11) % 480) / 30);
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

import { Component, OnInit } from '@angular/core';
import { RecorderService } from './services/recorder.service';

import { applyChange } from 'deep-diff';
import { w3Collection, IStateWrapper, IPlayer, IStateUpdate, IHeroState, EStateKeys, EGameStateEnum, EGameModeEnum, ERace, IHeroesState } from './data/models';
import { BaseComponent } from './base.component';
import { IngameOverlayService } from './services/ingame-overlay.service';
import { HttpClient } from '@angular/common/http';
import { trigger, state as astate, style, transition, animate, keyframes } from '@angular/animations';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    animations: [
        trigger('EnterLeave', [
            astate('flyIn', style({ transform: 'translateX(0)' })),
            transition(':enter', [
                style({ transform: 'translateX(-100%)' }),
                animate('0.5s 300ms ease-in')
            ]),
            transition(':leave', [
                animate('0.3s ease-out', style({ transform: 'translateX(100%)' }))
            ])
        ]),
        ,
        trigger('blink', [
            transition(':enter', [
                animate('5s', keyframes([
                    style({ backgroundColor: '#6f6f6f', offset: 0 }),
                    style({ backgroundColor: '#3399ff', offset: 0.15 }),
                    style({ backgroundColor: '#fff', offset: 0.3 }),
                    style({ backgroundColor: '3399ff', offset: 0.45 }),
                    style({ backgroundColor: '#fff', offset: 0.60 }),
                    style({ backgroundColor: '3399ff', offset: 0.75 }),
                    style({ backgroundColor: '#fff', offset: 0.90 }),
                    style({ backgroundColor: '#fff', offset: 1.00 })
                ]))
            ])
        ])
    ]
})
export class AppComponent extends BaseComponent implements OnInit {

    constructor(private http: HttpClient, private ingameOverlayService: IngameOverlayService) {
        super();
        this.recorderService = new RecorderService(this, this.http);
        this.state.isVisible = true;
    }

    public state = {
        error: '',
        finishedLoading: false,
        theme: 'lighta',
        isVisible: false,
        serviceState: null as IStateWrapper
    };


    public Object = Object;
    public Array = Array;
    public w3Collection = w3Collection;
    public Math = Math;
    public streamer: IPlayer;
    public opponent: IPlayer;
    public requiredAvatarCoverCount = 0;
    public additionalCSSClasses: string;
    public gameSpecificAssetBasePath = 'assets/';
    public assetBasePath = 'assets/';
    public isReforged = false;
    public isIngameOverlay = true;

    public abilityCooldowns = new Map<string, { total: number, remaining: number }>();

    private recorderService: RecorderService = null;
    private upcomingUpdates = new Array<IStateUpdate>();
    private proceedHandler = null;
    private delay = 0;
    private readonly ACTION_DELAY_IN_MS = 1300;

    readonly researchDurationInMS = 60000;
    readonly attackAndDefenseResearches = ['Rema', 'Rema2', 'Rema3', 'Rerh', 'Rerh2', 'Rerh3', 'Resm', 'Resm2', 'Resm3', 'Resw', 'Resw2', 'Resw3',
        'Rhar', 'Rhar2', 'Rhar3', 'Rhla', 'Rhla2', 'Rhla3', 'Rhme', 'Rhme2', 'Rhme3', 'Rhra', 'Rhra2', 'Rhra3', 'Roar', 'Roar2', 'Roar3',
        'Rome', 'Rome2', 'Rome3', 'Rora', 'Rora2', 'Rora3', 'Ruar', 'Ruar2', 'Ruar3', 'Rucr', 'Rucr2', 'Rucr3', 'Rume', 'Rume2', 'Rume3',
        'Rura', 'Rura2', 'Rura3'];

    private warnedUndefineds = new Set<string>();

    public ngOnInit() {
        console.warn('AHA!');
        this.isIngameOverlay = this.ingameOverlayService.isIngameOverlay();
        console.warn(this.isIngameOverlay);
        if (this.isIngameOverlay) {
            this.ingameOverlayService.initialize();
        }

        if (!this.state.finishedLoading) {
            this.recorderService.onStateInit(state => {
                this.state.serviceState = state;
                this.postStateUpdate(state);
                this.state.finishedLoading = true;
            });
            this.recorderService.onStateUpdate(update => {
                update.time = new Date(update.time);
                update.time.setMilliseconds(update.time.getMilliseconds() - this.ACTION_DELAY_IN_MS);
                if (this.proceedUpdate(update)) {

                } else {
                    this.upcomingUpdates.push(update);
                    if (!this.proceedHandler) {
                        this.proceedHandler = setInterval(() => {
                            const indicesToRemove = [];
                            for (let i = 0; i < this.upcomingUpdates.length; i++) {
                                if (this.proceedUpdate(this.upcomingUpdates[i])) {
                                    indicesToRemove.push(i);
                                }
                            }
                            if (indicesToRemove.length > 0) {

                                if (indicesToRemove.length === this.upcomingUpdates.length) {
                                    this.upcomingUpdates = new Array();
                                } else {
                                    while (indicesToRemove.length > 0) {
                                        const index = indicesToRemove.pop();
                                        this.upcomingUpdates.splice(index, 1);
                                    }
                                }
                            }

                            if (this.upcomingUpdates.length <= 0) {
                                clearInterval(this.proceedHandler);
                                this.proceedHandler = null;
                            }

                        }, 50);
                    }
                }
            });

            this.recorderService.connect().catch(err => {
                console.log('ERROR:' + err);
                this.state.error = err;
            });
        }

        setInterval(() => {
            if (this.state && this.state.serviceState && this.state.serviceState.heroes && this.state.serviceState.game && this.state.serviceState.game.gameTime) {
                for (const heroState of Object.values(this.state.serviceState.heroes) as [IHeroesState]) {
                    for (const hero of Object.values(heroState)) {
                        for (const ability of hero.abilities) {
                            if (ability.lastActivation > 0) {
                                try {
                                    let currentCD = this.abilityCooldowns.get(ability.id);
                                    if (!currentCD) {
                                        currentCD = { total: 0, remaining: 0 };
                                        this.abilityCooldowns.set(ability.id, currentCD);
                                    }

                                    currentCD.total = w3Collection[ability.name]['Cool' + ((ability.level > 0) ? ability.level : 1)];
                                    const elapsedTime = this.state.serviceState.game.gameTime - Math.ceil(ability.lastActivation / 1000);
                                    let remainingTime = currentCD.total - elapsedTime;
                                    if (remainingTime < 0) {
                                        remainingTime = 0;
                                    }

                                    if (remainingTime !== currentCD.remaining) {
                                        currentCD.remaining = remainingTime;
                                    }
                                } catch (e) {
                                    console.warn(e);
                                }
                            }
                        }
                    }
                }
            }
        }, 100);
    }

    public getActiveResearches(playerId: number) {
        const activeResearches = this.state.serviceState.upgrades[playerId].active;
        if (this.state.serviceState.settings.researchesShowAllEnabled === true) {
            return activeResearches;
        }

        return activeResearches.filter(u => this.isAttackOrDefenseResearch(u.name));
    }

    public isAttackOrDefenseResearch(researchName: string) {
        return this.attackAndDefenseResearches.indexOf(researchName) >= 0;
    }

    public getBuildOrderOverlay() {
        const buildOrderState = (this.state.serviceState as any)?.buildOrder;
        if (!buildOrderState || !buildOrderState.enabled || !buildOrderState.order) {
            return null;
        }
        return buildOrderState;
    }

    public getVisibleBuildOrderSteps(buildOrderState: any) {
        const steps = buildOrderState?.order?.steps || [];
        const firstOpenIndex = Math.max(0, steps.findIndex(step => step.status !== 'done'));
        const start = Math.max(0, firstOpenIndex - 1);
        return steps.slice(start, start + 5);
    }

    public formatBuildOrderTime(seconds: number) {
        seconds = Math.max(0, Number(seconds) || 0);
        return Math.floor(seconds / 60) + ':' + Math.floor(seconds % 60).toString().padStart(2, '0');
    }

    public getHeroExperienceProgess(hero: IHeroState) {
        return (Math.sqrt(0.02 * hero.experience + 2.25) - 0.5) % 1;
    }

    public getHeroLevel(hero: IHeroState) {
        const result = (Math.sqrt(0.02 * hero.experience + 2.25) - 0.5);
        return this.toFixed(result, result >= 10 ? 0 : 1);
    }

    public keepPipeOrder() {
        return 0;
    }

    private proceedUpdate(update: IStateUpdate): boolean {
        const streamTime = new Date();
        streamTime.setMilliseconds(streamTime.getMilliseconds() - Math.trunc(this.delay * 1000));
        if (true || update.time <= streamTime) {
            /*
            console.log("UPDATE STATE " + update.stateType + " " + ((update.isSnapshot) ? "AS SNAPSHOT" : "INCREMENTAL"))
            console.log("STATE BEFORE");
            console.log(this.state.serviceState[update.stateType]);
            */
            if (update.isSnapshot) {
                this.state.serviceState[update.stateType] = update.snapshot as any;
            } else {
                for (const difference of update.differences) {
                    applyChange(this.state.serviceState[update.stateType], null, difference);
                }
            }
            /*
            console.log("STATE AFTER");
            console.log(this.state.serviceState[update.stateType]);
            console.log(update);
            */
            this.postStateUpdate(this.state.serviceState, update.stateType);
            console.log(this.state);
            return true;
        }
        return false;
    }

    private postStateUpdate(state: IStateWrapper, stateType: EStateKeys = null) {
        delete this.streamer;
        delete this.opponent;
        this.additionalCSSClasses = '';
        this.assetBasePath = 'assets/';
        this.isReforged = false;
        if (state && state.game && state.settings) {
            if (state.game.state === EGameStateEnum.NO_GAME) {
                this.abilityCooldowns.clear();
            }

            this.isReforged = (state.game.isReforged === true);
            this.gameSpecificAssetBasePath = (this.isReforged) ? 'assets/reforged/' : 'assets/classic/';
            if (state.game.broadcasterId !== undefined) {
                this.streamer = state.game.players[state.game.broadcasterId];
            }

            // anonymize FFA
            if (state.game.players && state.game.gameMode === EGameModeEnum.GM_4FFA && state.game.realm === 'W3Champions') {
                for (const player of Object.values(state.game.players)) {
                    if (state.game.broadcasterId !== player.id) {
                        player.name = 'Player ' + (player.team + 1);
                        player.race = ERace.RANDOM;
                        console.log('HAPPENED');
                        delete player.mainAccount;
                    }
                }
            }

            if (state.game.players && Object.keys(state.game.players).length === 2) {
                if (!state.heroes) {
                    state.heroes = {};
                }

                if (!state.upgrades) {
                    state.upgrades = {};
                }

                if (!this.isObserverOrReplay()) {
                    if (this.streamer.mainAccount) {
                        this.streamer.mainAccount.name = state.settings.username;
                    } else {
                        this.streamer.mainAccount = { name: state.settings.username };
                    }
                    console.log(this.state.serviceState.game);
                    this.streamer.mainAccount.country = state.settings.nationality;
                }

                for (const player of Object.values(state.game.players)) {
                    if (player.id !== state.game.broadcasterId) {
                        this.opponent = player;
                        break;
                    }
                }

                if (this.showObserverBar()) {
                    if (this.opponent.startPosition.x < this.streamer.startPosition.x) {
                        const tmpPlayerSwitch = this.streamer;
                        this.streamer = this.opponent;
                        this.opponent = tmpPlayerSwitch;
                    }

                    if(state.settings?.reversePlayerOrder) {
                        const temp = this.streamer;
                        this.streamer = this.opponent;
                        this.opponent = temp;
                    }
                }
            }

            this.calculateRequiredAvatarCoverCount();
        }

        if (state.settings && state.settings.additionalCSSClasses) {
            this.additionalCSSClasses = (Object as any).values(state.settings.additionalCSSClasses).reduce((cLast, cNow) => {
                return ((cLast) ? cLast + ' ' : '') + cNow;
            });
        }
    }
    public getIconPath(type, key) {

        if (key.length > 4) {
            return this.gameSpecificAssetBasePath + 'img/icons/' + key.toLowerCase() + '.png';
        } else {
            if (w3Collection[key] === undefined) {
                if (!this.warnedUndefineds.has(key)) {
                    this.warnedUndefineds.add(key);
                    console.warn(key + ' IS UNDEFINED!!!');
                }

                return null;
            } else {
                return this.gameSpecificAssetBasePath + 'img/icons/' + w3Collection[key].icon;
            }
        }
    }

    public isObserverOrReplay() {
        if (this.state.serviceState && this.state.serviceState.game) {
            return this.state.serviceState.game.isReplay || this.state.serviceState.game.isObserver;
        }
        return false;
    }

    public showObserverBar() {
        if (this.state.serviceState && this.state.serviceState.game) {
            return this.isObserverOrReplay() && this.state.serviceState.game.gameMode === EGameModeEnum.GM_1V1;
        }
        return false;
    }

    public showObserverBar4v4() {
        if (this.state.serviceState && this.state.serviceState.game) {
            return this.isObserverOrReplay() && this.state.serviceState.game.gameMode === EGameModeEnum.GM_4V4;
        }
        return false;
    }

    public calculateRequiredAvatarCoverCount() {
        this.requiredAvatarCoverCount = 0;
        if (this.state.serviceState && this.state.serviceState.game && this.state.serviceState.game.isReplay && !this.state.serviceState.game.isObserver && this.state.serviceState.heroes && this.opponent && this.state.serviceState.heroes[this.state.serviceState.game.broadcasterId]) {
            const playerHeroes = this.state.serviceState.heroes[this.streamer.id];
            const playerHeroesCount = (playerHeroes) ? Object.keys(playerHeroes).length : 0;
            this.requiredAvatarCoverCount = Math.max(0, Object.keys(this.state.serviceState.heroes[this.state.serviceState.game.broadcasterId]).length - playerHeroesCount);
        }
    }

    public getRequiredAvatarCoverCount4v4() {
        if (!this.state.serviceState || !this.state.serviceState.game || !this.state.serviceState.heroes) {
            return 0;
        }

        if (this.state.serviceState.game.isReplay !== true || this.state.serviceState.game.isObserver === true || this.state.serviceState.game.broadcasterId === undefined) {
            return 0;
        }

        const broadcasterHeroes = this.state.serviceState.heroes[this.state.serviceState.game.broadcasterId];
        const broadcasterHeroCount = broadcasterHeroes ? Math.min(3, Object.keys(broadcasterHeroes).length) : 0;
        return broadcasterHeroCount;
    }

    public getAvatarCoverTop(index: number) {
        switch (index) {
            case 1: return '12.90%';
            case 2: return '21.55%';
            default: return '4.30%';
        }
    }
}

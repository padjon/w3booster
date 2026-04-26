import { EGameStateEnum, IStateWrapper, IPlayer, EGameModeEnum, EStateKeys, IMiscState, IGameState, heroAliases, IHeroState, abilityAliases, utilAbilities, IUpgradeState, IPlayerStateWrapper, EResource } from 'app/data/models';
import { User, ISettingsState, IPlayerStats, IMainAccount } from 'app/data/models';
import { diff } from 'deep-diff';

export abstract class AbstractStateManagerService {

    public abstract getSettings(observerSettings?: boolean): Promise<ISettingsState>;
    public abstract getParseUser(): User;
    public abstract sendStateDiff(key: EStateKeys, differences: Array<any>);
    public abstract sendStateSnapshot(key: EStateKeys);
    public abstract sendAllStateSnapshots();
    public abstract getPlayerStats(player: IPlayer, realm: string): Promise<IPlayerStats>;
    public abstract getPlayerMainAccount(player: IPlayer, realm: string): Promise<IMainAccount>;
    public abstract onGameCreationStarted(rawGameData: any);
    public abstract onGameCreationFinished(state: IStateWrapper);

    private state: IStateWrapper;
    private playerStates: Map<number, IPlayerStateWrapper>;

    public isGameRunning(): boolean {
        return (this.state.game.state === EGameStateEnum.GAME_START || this.state.game.state === EGameStateEnum.GAME_RUNNING);
    }

    public isObserverOrReplay(): boolean {
        return (this.state.game.isObserver || this.state.game.isReplay);
    }

    public initByState(state: IStateWrapper, playerStates?: { [playerId: number]: IPlayerStateWrapper }) {
        this.resetState();
        this.state = state;

        if (this.state.game && (this.state.game.state === EGameStateEnum.GAME_START || this.state.game.state === EGameStateEnum.GAME_RUNNING)) {
            for (const playerId of Object.keys(this.state.game.players)) {
                this.initPlayerState(Number(playerId));
            }

            if (playerStates) {
                for (const playerId of Object.keys(playerStates)) {
                    this.playerStates.set(Number(playerId), playerStates[playerId]);
                }
            }

            this.onAfterBroadcasterChange();
        }
        this.sendAllStateSnapshots();

    }

    public getState(): IStateWrapper {
        return this.state;
    }

    public getPlayerStates() {
        return this.playerStates;
    }

    public resetState() {
        // make sure, to cancel the delayed callback or the in research being upgrades are shown after the game was
        this.initState();
    }

    public async updateGameState(state: EGameStateEnum, rawGameData?) {
        if (this.state.game.state !== state && state !== EGameStateEnum.GAME_RUNNING) {
            this.state.game.state = state;
            if (state === EGameStateEnum.GAME_FINISHED || state === EGameStateEnum.NO_GAME) {
                this.resetState();
                this.sendAllStateSnapshots();
            } else if (state === EGameStateEnum.GAME_START) {
                this.resetState();
                try {
                    rawGameData.game.name = decodeURIComponent(rawGameData.game.name);
                    rawGameData.game.creator = decodeURIComponent(rawGameData.game.creator);
                    rawGameData.game.map = decodeURIComponent(rawGameData.game.map);
                    for (const index of Object.keys(rawGameData.players)) {
                        rawGameData.players[index].name = decodeURIComponent(rawGameData.players[index].name);
                    }
                } catch(e) {
                    console.warn('UNABLE TO DECODE SOME COMPONENT!')
                    console.warn(JSON.stringify(rawGameData));
                }


                console.log('NEW GAME RAW DATA:');
                console.log(JSON.stringify(rawGameData));

                this.state.misc.localServerUrls = rawGameData.localServerUrls;
                this.state.game.id = rawGameData.id;
                this.state.game.state = EGameStateEnum.GAME_START;
                this.state.game.isReplay = rawGameData.isReplay;
                this.state.game.isReforged = rawGameData.isReforged;
                this.state.game.isObserver = rawGameData.isObserver;
                this.state.game.broadcasterId = rawGameData.broadcasterId;
                this.state.game.realBroadcasterId = rawGameData.broadcasterId;
                this.state.game.realm = rawGameData.realm;
                this.state.game.start = new Date();
                this.state.game.players = {};
                this.state.game.map = rawGameData.game.map.split('/').reverse()[0].split('\\').reverse()[0].replace(/\.w3[xm]{1}/g, '').replace(/([A-Z]{1}[a-z])/g, ' $1').replace(/\([0-9]+\)/g, '').replace(/[\_\-]/g, ' ').trim();
                this.state.game.paused = false;

                // Initialize players
                for (const player of Object.values(rawGameData.players as { [id: number]: IPlayer })) {
                    if (player.team !== undefined && player.team !== 24) {
                        delete (player as any).name_buffer;
                        this.state.game.players[player.id] = player;
                        this.initPlayerState(player.id);
                    }
                }

                // detect gamemode
                const teamArray = Object.values(this.state.game.players).map(p => p.team);
                const teams = new Set(teamArray);
                if (teams.size === 2) {
                    let index = 0;
                    const counts = new Array();
                    for (const team of teams) {
                        counts[index++] = teamArray.filter(t => t === team).length;
                    }
                    const isSymetric = counts[0] === counts[1];

                    if (!isSymetric || teamArray.length > 8) {
                        this.state.game.gameMode = EGameModeEnum.GM_CUSTOM;
                    } else {
                        switch (teamArray.length) {
                            case 2: {
                                this.state.game.gameMode = EGameModeEnum.GM_1V1;
                            } break;
                            case 4: {
                                this.state.game.gameMode = EGameModeEnum.GM_2V2;
                            } break;
                            case 6: {
                                this.state.game.gameMode = EGameModeEnum.GM_3V3;
                            } break;
                            case 8: {
                                this.state.game.gameMode = EGameModeEnum.GM_4V4;
                            } break;
                        }
                    }
                } else if (teamArray.length === teams.size && teams.size >= 3 && teams.size <= 4) {
                    this.state.game.gameMode = (teams.size === 3) ? EGameModeEnum.GM_3FFA : EGameModeEnum.GM_4FFA;
                } else {
                    this.state.game.gameMode = EGameModeEnum.GM_CUSTOM;
                }

                this.initByState(this.state);
                this.state.settings = await this.getSettings(this.isObserverOrReplay());

                if (!this.isObserverOrReplay()) {
                    this.getBroadcastingPlayer().mainAccount = { name: this.state.settings.username ? this.state.settings.username : this.getParseUser().displayName, country: this.state.settings.nationality };
                }

                console.log('Finished game initialization:');
                console.log(this.state);
                this.sendAllStateSnapshots();
                this.onGameCreationStarted(rawGameData);

                // Do all the async stuff
                const asyncPromissesToWaitFor = new Array<Promise<any>>();
                for (const player of Object.values(this.state.game.players)) {
                    const realm = rawGameData.realm;
                    const rawGameDataPlayer = rawGameData.players[player.id];
                    // fetch stats
                    const playerStatsPromise = this.getPlayerStats(rawGameDataPlayer, realm);
                    playerStatsPromise.then((results) => {
                        if(this.isGameRunning()) {
                            console.log('Determined stats for ' + player.name);
                            console.log(results);
                            this.state.game.players[player.id].stats = results;
                        }
                    });
                    asyncPromissesToWaitFor.push(playerStatsPromise);

                    if (player.mainAccount === undefined) {
                        const mainAccountPromise = this.getPlayerMainAccount(rawGameDataPlayer, realm);
                        mainAccountPromise.then((mainAccount) => {
                            this.state.game.players[player.id].mainAccount = mainAccount;
                        });
                        asyncPromissesToWaitFor.push(mainAccountPromise);
                    }
                }

                const gameId = this.state.game.id;
                Promise.all(asyncPromissesToWaitFor).then(() => {
                    if (this.state && this.state.game && this.state.game.id === gameId) {
                        const gameState = JSON.parse(JSON.stringify(this.state.game)) as IGameState;
                        for (const player of Object.values(gameState.players)) {
                            player.stats = undefined;
                            player.mainAccount = undefined;
                            //
                        }
                        this.state.game.state = EGameStateEnum.GAME_RUNNING;
                        const gameStateDifferences = diff(gameState, this.state.game);
                        if (gameStateDifferences) {
                            this.sendStateDiff(EStateKeys.GAME_STATE, gameStateDifferences);
                        }
                        this.onGameCreationFinished(this.state);
                    }
                });
            } else {
                this.sendStateSnapshot(EStateKeys.GAME_STATE);
            }
        }
    }

    public updateStateByUpdate(update) {
        let playerId = -1;
        try {

            if (update.class === 'W3MatchScore') {
                const miscState: IMiscState = Object.assign({}, this.state.misc);
                miscState.matchscoreWins = Number(update.value.wins);
                miscState.matchscoreLosses = Number(update.value.losses);
                const miscStateDifferences = diff(this.state.misc, miscState);
                if (miscStateDifferences) {
                    this.state.misc = miscState;
                    this.sendStateDiff(EStateKeys.MISC_STATE, miscStateDifferences);
                }
                return;
            } else if (!this.isGameRunning()) {
                console.warn('received game data update but no game is running! User: ' + this.getParseUser().displayName);
                console.warn(update);
                return;
            }

            playerId = (update.hasOwnProperty('slotId')) ? update.slotId : ((update.class === 'W3Player') ? update.id : -1);

            if (update.class !== 'W3GameTime') {
                // console.log(update.class + ' ' + playerId);
                // console.log(update);
            }
            if (update.class === 'W3GameTime' && this.state.settings.topBarGameDurationEnabled) {
                const gameState: IGameState = Object.assign({}, this.state.game);
                gameState.gameTime = update.value;
                const gameStateDifferences = diff(this.state.game, gameState);
                if (gameStateDifferences) {
                    this.state.game = gameState;
                    this.sendStateDiff(EStateKeys.GAME_STATE, gameStateDifferences);
                }
            } else if (update.class === 'W3ChatbarState') {
                const miscState: IMiscState = Object.assign({}, this.state.misc);
                miscState.chatbarOpen = (Number(update.value) === 1);
                const miscStateDifferences = diff(this.state.misc, miscState);
                if (miscStateDifferences) {
                    this.state.misc = miscState;
                    this.sendStateDiff(EStateKeys.MISC_STATE, miscStateDifferences);
                }
            } else if (update.class === 'W3HudScale') {
                const miscState: IMiscState = Object.assign({}, this.state.misc);
                const scale0To128 = Number(update.value);
                let scale0To100 = (((scale0To128 <= 24) ? (scale0To128 / 2.4) : (10 + (scale0To128 - 24) / 1.15))*10)/10;
                scale0To100 = (scale0To100 < 50) ? Math.round(scale0To100) : Math.ceil(scale0To100)
                miscState.hudScale = (scale0To100 / 100) * 0.5 + 0.5;
                console.log('hudscale:', miscState.hudScale);
                const miscStateDifferences = diff(this.state.misc, miscState);
                if (miscStateDifferences) {
                    this.state.misc = miscState;
                    this.sendStateDiff(EStateKeys.MISC_STATE, miscStateDifferences);
                }
            } else if (update.class === 'W3TeamColor') {
                const miscState: IMiscState = Object.assign({}, this.state.misc);
                miscState.teamColors = Boolean(update.value);
                const miscStateDifferences = diff(this.state.misc, miscState);
                if (miscStateDifferences) {
                    this.state.misc = miscState;
                    this.sendStateDiff(EStateKeys.MISC_STATE, miscStateDifferences);
                }
            } else if (update.class === 'W3Player') {
                if (update.id === this.state.game.broadcasterId) {
                    const gameState: IGameState = JSON.parse(JSON.stringify(this.state.game));
                    const players = Object.values(gameState.players);
                    if (players.find(p => p.id === update.id) === undefined) {
                        console.warn('PLAYER NOT FOUND!!');
                        console.log(update);
                        console.log(gameState.players);
                    }
                    players.find(p => p.id === update.id).controlgroups = update.controlgroups;

                    const gameStateDifferences = diff(this.state.game, gameState);
                    if (gameStateDifferences) {
                        this.state.game = gameState;
                        this.sendStateDiff(EStateKeys.GAME_STATE, gameStateDifferences);
                    }
                }
            } else if (update.class === 'W3Resource') {
                 const resources = Object.assign({}, this.state.resources);
                if (this.playerStates.get(playerId) === undefined) {
                    console.warn('PLAYER NOT FOUND (W3Resource)!!');
                    console.log(update);
                    console.log('looked for:' + playerId);
                    console.log(this.playerStates);
                }
                const resourceState = this.playerStates.get(playerId).resources[playerId];
                if(update.type === EResource.GOLD || update.type === EResource.LUMBER) {
                    resourceState[update.type] = update.value / 10;
                } else {
                    resourceState[update.type] = update.value;
                }
                console.log('Resource State Update for user :' + this.state.game.players[playerId].name);
                console.log(resourceState);
                resources[playerId] = JSON.parse(JSON.stringify(resourceState));

                if (this.isObserverOrReplay() || playerId === this.state.game.broadcasterId) {
                    const resourcesStateDifferences = diff(this.state.resources, resources);
                    if (resourcesStateDifferences) {
                        this.state.resources = resources;
                        this.sendStateDiff(EStateKeys.RESOURCES_STATE, resourcesStateDifferences);
                    }
                }
                
            } else if (update.class === 'W3PlayerSlot') {
                const newBroadcasterId = Number(update.value);
                if (newBroadcasterId !== this.state.game.broadcasterId || newBroadcasterId !== this.state.game.realBroadcasterId) {
                    this.state.game.broadcasterId = newBroadcasterId;
                    this.state.game.realBroadcasterId = newBroadcasterId;
                    this.onAfterBroadcasterChange();
                    this.sendAllStateSnapshots();
                    console.log('Switched visible player to :' + this.getBroadcastingPlayer().name);
                }
            } else if (update.class === 'W3Unit' && update.isHero && playerId >= 0) {
                if (heroAliases.has(update.type)) {
                    update.type = heroAliases.get(update.type);
                }

                const heroes = Object.assign({}, this.state.heroes);
                const heroesState = this.playerStates.get(playerId).heroes[playerId];
                const heroState: IHeroState = {
                    name: update.type,
                    experience: (update.experience) ? Number(update.experience) : 0,
                    hitpoints: update.hitpoints,
                    mana: update.mana,
                    abilities: new Array(),
                    items: new Array()
                };

                if (update.abilities) {
                    for (const ability of update.abilities.sort((a, b) => (a.order < b.order) ? 1 : -1)) {
                        const type = abilityAliases.has(ability.type) ? abilityAliases.get(ability.type) : ability.type;
                        const isUtil = utilAbilities.indexOf(type) >= 0;
                        const level = (isUtil) ? 0 : ability.level;
                        heroState.abilities.push({ name: type, level, lastActivation: ability.lastActivation, id: 'A' + playerId + type });
                    }
                }

                if (update.inventory) {
                    heroState.items = update.inventory;
                }

                heroesState[update.type] = heroState;
                console.log('Hero State Update for user :' + this.state.game.players[playerId].name);

                heroes[playerId] = JSON.parse(JSON.stringify(heroesState));

                if (this.isObserverOrReplay() || playerId === this.state.game.broadcasterId) {
                    const heroStateDifferences = diff(this.state.heroes, heroes);
                    if (heroStateDifferences) {
                        console.log('Submitted differences:');
                        console.log(heroStateDifferences);
                        this.state.heroes = heroes;
                        this.sendStateDiff(EStateKeys.HEROES_STATE, heroStateDifferences);
                    }
                }
            } else if (update.class === 'W3Research' && playerId >= 0) {
                const upgrades = Object.assign({}, this.state.upgrades);
                if (this.playerStates.get(playerId) === undefined) {
                    console.warn('PLAYER NOT FOUND (W3Research)!!');
                    console.log(update);
                    console.log('looked for:' + playerId);
                    console.log(this.playerStates);
                }
                const upgradeState: IUpgradeState = this.playerStates.get(playerId).upgrades[playerId];
                // upgradeState.upgrades = JSON.parse(JSON.stringify(this.state.upgrades.upgrades));
                // upgradeState.active = JSON.parse(JSON.stringify(this.state.upgrades.active));
                // upgradeState.researching = [];

                upgradeState.upgrades.push({ name: update.type + ((update.level > 1) ? update.level : ''), gametime: Date.now() });
                if (upgradeState.active.find((u) => u.name === update.type)) {
                    upgradeState.active.find((u) => u.name === update.type).level = update.level;
                } else {
                    upgradeState.active.push({ name: update.type, gametime: Date.now(), level: update.level });
                }

                console.log('Upgrade State Update for user :' + this.state.game.players[playerId].name);
                console.log(upgradeState);
                upgrades[playerId] = JSON.parse(JSON.stringify(upgradeState));

                if (this.isObserverOrReplay() || playerId === this.state.game.broadcasterId) {
                    const upgradeStateDifferences = diff(this.state.upgrades, upgrades);
                    if (upgradeStateDifferences) {
                        this.state.upgrades = upgrades;
                        this.sendStateDiff(EStateKeys.UPGRADES_STATE, upgradeStateDifferences);
                    }
                }
            }
        } catch (e) {
            console.warn('ISSUE with Update:');
            console.warn(update);
            console.warn('PLAYER-ID was:' + playerId);
            console.warn(e);
            console.warn(this.state);
        }
    }

    public async onSettingsChanged() {
        if (this.isGameRunning()) {
            this.state.settings = await this.getSettings(this.isObserverOrReplay());
            console.log(this.state.settings);
            this.sendStateSnapshot(EStateKeys.SETTINGS_STATE);
        }
    }

    public getBroadcastingPlayer(): IPlayer {
        return this.state.game.players[this.state.game.broadcasterId];
    }

    private onAfterBroadcasterChange() {

        if (this.playerStates.has(this.state.game.broadcasterId) && !this.isObserverOrReplay()) {
            this.state.heroes = JSON.parse(JSON.stringify(this.playerStates.get(this.state.game.broadcasterId).heroes));
            this.state.upgrades = JSON.parse(JSON.stringify(this.playerStates.get(this.state.game.broadcasterId).upgrades));
        } else if (!this.playerStates.has(this.state.game.broadcasterId)) {
            this.state.heroes = {};
            this.state.upgrades = {};
            for (const playerStateWrapper of Array.from(this.playerStates.values())) {
                Object.assign(this.state.heroes, JSON.parse(JSON.stringify(playerStateWrapper.heroes)));
                Object.assign(this.state.upgrades, JSON.parse(JSON.stringify(playerStateWrapper.upgrades)));
            }
            this.state.game.broadcasterId = Number(Object.keys(this.state.game.players)[0]);
            console.log('SWITCHED TO OBSERVER, viewing as the following player:' + this.getBroadcastingPlayer().name);
        }
        this.state.game.isObserver = (this.state.game.broadcasterId !== this.state.game.realBroadcasterId);
    }


    private initState() {
        this.state = {
            misc: {
                chatbarOpen: (this.state && this.state.misc.chatbarOpen) ? this.state.misc.chatbarOpen : false,
                hudScale: (this.state && this.state.misc.hudScale) ? this.state.misc.hudScale : 1.0,
                matchscoreWins: (this.state && this.state.misc.matchscoreWins) ? this.state.misc.matchscoreWins : 0,
                matchscoreLosses: (this.state && this.state.misc.matchscoreLosses) ? this.state.misc.matchscoreLosses : 0,
                teamColors: (this.state && this.state.misc.teamColors) ? this.state.misc.teamColors : false,
                localServerUrls: [],
            },
            settings: {} as any,
            game: {
                id: Math.random(),
                state: EGameStateEnum.NO_GAME,
                paused: false,
                pausedTime: 0,
                gameTime: 0,
                gameMode: EGameModeEnum.GM_UNDEFINED,
                players: {}
            },
            heroes: {},
            upgrades: {},
            resources: {},
        };
        this.playerStates = new Map();
    }

    private initPlayerState(playerId: number) {
        const playerStateWrapper: IPlayerStateWrapper = {
            heroes: {},
            upgrades: {},
            resources: {},
        };

        playerStateWrapper.heroes[playerId] = {};
        playerStateWrapper.upgrades[playerId] = {
            upgrades: [],
            active: [],
            researching: []
        };
        playerStateWrapper.resources[playerId] = {};

        this.playerStates.set(playerId, playerStateWrapper);
    }
}

import { OverlaySettings } from '../overlay-settings';

export enum EStateKeys {
    MISC_STATE = 'misc',
    SETTINGS_STATE = 'settings',
    HEROES_STATE = 'heroes',
    GAME_STATE = 'game',
    UPGRADES_STATE = 'upgrades',
    RESOURCES_STATE = 'resources',
}

export interface IStateUpdate {
    time: Date;
    isSnapshot: boolean;
    stateType: EStateKeys;
    differences?: Array<any>;
    snapshot?: IHeroState | IGameState;
}

export interface IStateWrapper extends IPlayerStateWrapper {
    misc: IMiscState;
    settings: ISettingsState;
    game: IGameState;
}

export interface IPlayerStateHeroes { [playerId: number]: IHeroesState }
export interface IPlayerStateUpgrades { [playerId: number]: IUpgradeState }
export interface IPlayerStateResources { [playerId: number]: IPlayerResources }

export interface IPlayerStateWrapper {
    heroes: IPlayerStateHeroes;
    upgrades: IPlayerStateUpgrades;
    resources: IPlayerStateResources;
}

export interface IHeroesState {
    [hero: string]: IHeroState;
}

export interface IHeroState {
    name: string;
    experience: number;
    hitpoints?: {
        max: number;
        current: number;
    };
    mana?: {
        max: number;
        current: number;
    };
    abilities: Array<{
        id: string,
        name: string,
        level: number,
        lastActivation: number
    }>;
    items: Array<string>;
}

export interface IUpgradeState {
    upgrades: Array<{
        name: string,
        gametime: number,
    }>;
    active: Array<{
        name: string,
        gametime: number,
        level: number
    }>;
    researching: Array<{
        name: string,
        level: number,
        gametime: number,
        researchStart: Date,
        researchFinish: Date
    }>;
}

export type IPlayerResources = {
    [resource in EResource]?: number;
};

export enum ERace {
    RANDOM = 0,
    HUMAN = 1,
    ORC = 2,
    UNDEAD = 3,
    NIGHT_ELF = 4,
}

export enum EResource {
		GOLD = 1,
		LUMBER = 2,
		SUPPLY = 5,
		SUPPLY_CAP = 4,
		WORKER_SUPPLY = 99,
}

export interface IPlayerStats {
    solo: IPlayerStatsObject;
    team: IPlayerStatsObject;
    team4: IPlayerStatsObject;
    ffa: IPlayerStatsObject;
}

export interface IPlayerStatsObject {
    wins: number;
    losses: number;
    winRate: number;
    level: number;
    rank: number;
    league?: number;
}

export interface IMainAccount {
    name: string;
    country?: string;
    mainRace?: ERace;
}

export interface IPlayer {
    id: number;
    neteaseId?: number;
    name: string;
    race: ERace;
    team: number;
    startPosition: {
        x: number;
        y: number;
    };
    colorId: number;
    isAI: boolean;
    stats?: IPlayerStats;
    mainAccount?: IMainAccount;
    controlgroups?: { [id: number]: ICommandGroup };
    ressources?: IPlayerRessources;
}

export interface IPlayerRessources {
    gold: number;
    lumber: number;
    food: number;
    food_cap: number;
    worker_food: number;
}

export interface ICommandGroup {
    size: number;
    frontunit: string;
}

export enum EGameStateEnum {
    GAME_START,
    GAME_RUNNING,
    GAME_FINISHED,
    NO_GAME
}


export enum EGameModeEnum {
    GM_UNDEFINED = 'undefined',
    GM_1V1 = 'gm-1v1',
    GM_2V2 = 'gm-2v2',
    GM_3V3 = 'gm-3v3',
    GM_4V4 = 'gm-4v4',
    GM_3FFA = 'gm-3ffa',
    GM_4FFA = 'gm-4ffa',
    GM_CUSTOM = 'gm-custom',
}

export class IGameState {
    id: number;
    state: EGameStateEnum;
    start?: Date;
    isReplay?: boolean;
    isReforged?: boolean;
    isObserver?: boolean;
    players: { [id: number]: IPlayer };
    realm?: string;
    broadcasterId?: number;
    realBroadcasterId?: number;
    map?: string;
    pausedTime: number;
    gameTime: number;
    paused: boolean;
    gameMode: EGameModeEnum;
}

export class IMiscState {
    chatbarOpen: boolean;
    hudScale: number;
    matchscoreWins: number;
    matchscoreLosses: number;
    teamColors: boolean;
    localServerUrls: Array<string>;
}


export class ISettingsState extends OverlaySettings {
}

export const abilityAliases = new Map().set('AUfa', 'AUfu')
    .set('ANc1', 'ANcs')
    .set('ANc2', 'ANcs')
    .set('ANc3', 'ANcs')
    .set('ANs1', 'ANsy')
    .set('ANs2', 'ANsy')
    .set('ANs3', 'ANsy')
    .set('ANg1', 'ANrg')
    .set('ANg2', 'ANrg')
    .set('ANg3', 'ANrg')
    .set('ANia', 'ANic');

export const heroAliases = new Map().set('Edmm', 'Edem')
    .set('Nrob', 'Ntin')
    .set('Nalm', 'Nalc')
    .set('Nal2', 'Nalc')
    .set('Nal3', 'Nalc');

export const raceNames = new Map().set(ERace.HUMAN, 'Human')
    .set(ERace.NIGHT_ELF, 'Night Elf')
    .set(ERace.ORC, 'Orc')
    .set(ERace.UNDEAD, 'Undead')
    .set(ERace.RANDOM, 'Random');

export const raceShortNames = new Map().set(ERace.HUMAN, 'HU')
    .set(ERace.NIGHT_ELF, 'NE')
    .set(ERace.ORC, 'ORC')
    .set(ERace.UNDEAD, 'UD')
    .set(ERace.RANDOM, 'RDM');

export const utilAbilities = ['AEtq', 'AHav', 'AEme', 'AEsf', 'AEsv', 'AHmt', 'AHpx', 'AHre', 'ANch', 'ANtm', 'AOeq', 'AOre', 'AOvd', 'AOww', 'AUan', 'AUdd', 'AUin', 'ANef', 'ANrg', 'ANvc', 'ANdo', 'ANst', 'ANto', 'AUls'];
export const queueRelevantUpdates = ['Rema', 'Rema2', 'Rema3', 'Rerh', 'Rerh2', 'Rerh3', 'Resm', 'Resm2', 'Resm3', 'Resw', 'Resw2', 'Resw3', 'Rhar', 'Rhar2', 'Rhar3', 'Rhla', 'Rhla2', 'Rhla3', 'Rhme', 'Rhme2', 'Rhme3', 'Rhra', 'Rhra2', 'Rhra3', 'Roar', 'Roar2', 'Roar3', 'Rome', 'Rome2', 'Rome3', 'Rora', 'Rora2', 'Rora3', 'Ruar', 'Ruar2', 'Ruar3', 'Rucr', 'Rucr2', 'Rucr3', 'Rume', 'Rume2', 'Rume3', 'Rura', 'Rura2', 'Rura3'];

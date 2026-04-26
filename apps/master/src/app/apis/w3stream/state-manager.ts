import { ServiceManager, W3StatsService, W3AliasService, AbstractStateManagerService } from 'app/data/services';
import { User, EStateKeys, IPlayer, IPlayerStats, IMainAccount, IStateUpdate, OverlaySettings } from 'app/data/models';
import { UserService } from 'app/data/modelservices';
import { wsManager } from './ws-manager';


const proStates = new Set<EStateKeys>()
    .add(EStateKeys.HEROES_STATE)
    .add(EStateKeys.UPGRADES_STATE);

const researchDurationPerLevel = new Map();
researchDurationPerLevel.set(1, 60 * 1000);
researchDurationPerLevel.set(2, 75 * 1000);
researchDurationPerLevel.set(3, 90 * 1000);

export class StateManager extends AbstractStateManagerService {

    private static stateManagerPromisses = new Map<string, Promise<StateManager>>();
    private static userToStateManagers = new Map<string, StateManager>();

    public static getAll(): Array<StateManager> {
        return [...StateManager.userToStateManagers.values()]
    }

    public static async getByUserId(userId: string): Promise<StateManager> {
        if (!StateManager.stateManagerPromisses.has(userId)) {
            StateManager.stateManagerPromisses.set(userId, new Promise<StateManager>(async res =>  {
                console.warn('fetching user:' + userId);
                const user = await ServiceManager.get(UserService).getById(userId);
                if (user) {
                    res(new StateManager(user));
                } else {
                    res(null)
                }
            }))
        }
        return StateManager.stateManagerPromisses.get(userId);
    }

    public static async getByUser(user: User): Promise<StateManager> {
        return StateManager.getByUserId(user.id);
    }

    private user: User;
    private w3StatsService = ServiceManager.get(W3StatsService);
    private w3AliasService = ServiceManager.get(W3AliasService);

    private constructor(user: User) {
        super()
        this.user = user;
        this.resetState();
        StateManager.userToStateManagers.set(this.user.id, this)
    }

    public onGameCreationStarted(rawGameData) {
    }

    public onGameCreationFinished(state) {
    }

    public getParseUser() {
        return this.user;
    }

    public async getSettings(observerSettings?: boolean) {
        this.user = await ServiceManager.get(UserService).getById(this.user.id, [(observerSettings) ? 'obsOverlaySettings' : 'playerOverlaySettings']);
        const settings = JSON.parse(JSON.stringify(this.user[(observerSettings) ? 'obsOverlaySettings' : 'playerOverlaySettings']));
        if (!settings.username || settings.username.trim().length == 0) {
            settings.username = this.user.displayName;
        }

        if (observerSettings) {
            const overlaySettings: OverlaySettings = settings;
            if (!this.user.isProPlan()) {
                const defaultOverlaySettings = new OverlaySettings();
                overlaySettings.headlineTop = defaultOverlaySettings.headlineTop;
                overlaySettings.headlineBot = defaultOverlaySettings.headlineBot;
                overlaySettings.headlineTopIsMainHeadline = defaultOverlaySettings.headlineTopIsMainHeadline;
            }
        }

        return settings;
    }

    public getChannel() {
        return this.user.id;
    }

    public getChannelSecret() {
        return this.user.broadcasterSecret;
    }

    public forceReloadFrontends() {
        this.broadcastToStreamer(this.getChannel(), { admin: 'forceReloadFrontend' });
    }

    public getPlayerStats(player: IPlayer, realm: string): Promise<IPlayerStats> {
        if (!player || player.isAI || (realm == 'Netease' && !player.neteaseId)) {
            return new Promise<IPlayerStats>((resolve, reject) => resolve(null));
        } else {
            const playerId = (realm == 'Netease') ? String(player.neteaseId) : player.name;
            return this.w3StatsService.getStats(realm, playerId, player.race);
        }
    }

    public getPlayerMainAccount(player: IPlayer, realm: string): Promise<IMainAccount> {
        if (!player || player.isAI || (realm == 'Netease' && !player.neteaseId)) {
            return new Promise<IMainAccount>((resolve, reject) => resolve(null));
        } else {
            return this.w3AliasService.getMainAccount(player.name, realm);
        }
    }

    public sendStateDiff(key: EStateKeys, differences: Array<any>) {
        if (this.user.isProPlan() || this.getState().game.isObserver || !proStates.has(key)) {
            this.broadcastToStreamer(this.getChannel(), { stateType: key, differences: differences, time: new Date(), isSnapshot: false } as IStateUpdate);
        }
    }

    public sendStateSnapshot(key: EStateKeys) {
        if (this.user.isProPlan() || this.getState().game.isObserver || !proStates.has(key)) {
            this.broadcastToStreamer(this.getChannel(), { stateType: key, snapshot: this.getState()[key], time: new Date(), isSnapshot: true } as IStateUpdate);
        } else {
            this.broadcastToStreamer(this.getChannel(), { stateType: key, snapshot: {}, time: new Date(), isSnapshot: true } as IStateUpdate);
        }
    }

    public sendAllStateSnapshots() {
        for (const key of Object.keys(EStateKeys)) {
            this.sendStateSnapshot(EStateKeys[key]);
        }
    }
    public getStateHandlerForWS(socket) {
        const state = {};
        for (const key of Object.keys(EStateKeys)) {
            const attrib = EStateKeys[key];
            if (this.user.isProPlan() || this.getState().game.isObserver || !proStates.has(attrib)) {
                state[attrib] = this.getState()[attrib];
            }
        }
        socket.send(JSON.stringify(state));
    }

    private broadcastToStreamer(channelId, message) {
        message = JSON.stringify(message);
        wsManager.channelBroadcast(channelId, message);
    }
}

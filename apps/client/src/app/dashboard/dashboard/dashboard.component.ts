import { HttpClient } from '@angular/common/http';
import { AuthenticationService, Parse, NodeService, StreamlabsService, BroadcastingServiceInterface } from 'app/data/services';
import { Component, OnInit, Injector, NgZone, ViewChild, ElementRef, AfterViewChecked, OnDestroy } from '@angular/core';
import { User, EUserSettingEnum, RolePrivilegeEnum, OverlaySettings, EClassCategory, EUserPlan, EventsystemConfigRule, EEventsystemConfigTarget, EventsystemConfig, EventsystemConfigRuleTrigger, EEventsystemConfigRuleTriggerType, EventsystemConfigRuleAction, EventsystemConfigRuleActions, EEventsystemActionSourceVisibility, EEventsystemConfigRuleActionType, raceNames, ERace } from 'app/data/models';
import { View } from '@app/views/view';
import { UserService, ShopOrderService } from '@app/data/modelservices';
import { environment } from '@app/data/common-imports';
import { countries } from '@app/data/app/models/transient/countries';
import { Router } from '@angular/router';
import { Server as WSServer } from 'ws';
import { AddressInfo } from 'net';
import ReconnectingWebSocket from 'reconnecting-websocket';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

enum ERecorderStates {
    UNEXPECTED_EXCEPTION,
    INITIALIZING,
    INITIALIZED,
    PRE_W3_LOOKUP,
    WAITING_FOR_W3,
    WAITING_FOR_64BIT_W3,
    ANALYZING_W3,
    ADMIN_REQUIRED,
    PRE_GAME_LOOKUP,
    WAITING_FOR_GAME,
    GAME_STARTING,
    GAME_STARTED,
    GAME_RUNNING,
    GAME_ENDED,
    RECORDER_STOPS
}

enum ERecorderMessageType {
    RECORDER_STATE,
    LOCAL_MATCHUP,
    LOCAL_GAMEDATA,
    GAMEDATA,
    MATCHUP,
    MATCHSCORE,
    PING,
    SWITCH_PLATFORM,
    REQUEST_ADMIN,
    GAMETIME
}

interface RecorderState {
    color: string;
    title: string;
    subtitle: string;
    key: ERecorderStates;
}

interface IPlayerStat {
    wins: number;
    losses: number;
    winRate: number;
    level: number;
    rank: number;
}

interface IPlayerStats {
    solo: IPlayerStat;
}

export interface IMainAccount {
    name: string;
    country?: string;
}

interface ITeamMember {
    name: string;
    color: string;
    race: string;
    stats?: IPlayerStat;
    main?: IMainAccount;
    isAI: boolean;
    startPosition?: {
        x: number;
        y: number;
    };
}
interface IMatch {
    id: number;
    isReplay: boolean;
    isObserver: boolean;
    time: Date;
    result: number;
    map: string;
    hasAIMembers: boolean;
    teams: Array<{
        id: number,
        members: Array<ITeamMember>
    }>;
}

type BuildOrderAction = 'train' | 'build' | 'upgrade' | 'custom';
type BuildOrderStepStatus = 'pending' | 'active' | 'done' | 'late' | 'missed';

interface IBuildOrderStep {
    id: string;
    atSeconds: number;
    action: BuildOrderAction;
    target: string;
    label: string;
    toleranceSeconds: number;
    status: BuildOrderStepStatus;
    completedAtSeconds?: number;
}

interface IBuildOrder {
    id: string;
    name: string;
    race: string;
    matchup: string;
    description: string;
    visibility: 'private' | 'shared';
    autoSelect: boolean;
    steps: Array<IBuildOrderStep>;
    updatedAt: number;
}

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent extends View implements OnInit, AfterViewChecked {
    public document = document;
    public user: User;
    public EClassCategory = EClassCategory;
    public EUserSettingEnum = EUserSettingEnum;
    public showUrl = false;
    public showEmbeddInfoMatchScore = false;
    public environment = environment;
    public recorderLog = '';
    public matchHistory = new Array<IMatch>();
    public countries = [];
    public selectedCountry = null;
    public versionIsNew = false;
    public recorderState: RecorderState = null;
    public updateMatchScoreAutomatically = true;
    public matchScoreWinsFilePath = '';
    public matchScoreLossFilePath = '';
    public gameTimeFilePath = '';
    public matchScore = { wins: 0, losses: 0, lastUpdate: 0 };
    public overlayUrl = 'notSet';
    public currentMatch: IMatch = null;
    public osVersion = 10;
    public showCompactDashboard = false;
    public broadcastingServices = new Array<BroadcastingServiceInterface>();
    public gameTime = ''
    public loadingScreen = false;
    public isDesktopClient = false;
    public buildOrders = new Array<IBuildOrder>();
    public selectedBuildOrderId = '';
    public activeBuildOrderId = '';
    public buildOrderShareCode = '';
    public buildOrderImportCode = '';
    public buildOrderAutoSelectEnabled = true;
    public buildOrderRaces = ['any', 'human', 'orc', 'undead', 'night elf', 'random'];
    public buildOrderActions = ['train', 'build', 'upgrade', 'custom'];

    public mainMenuTabs = {
        DASHBOARD: { name: 'Home', disabled: false, active: true, icon: 'fa fa-th' },
        BUILD_ORDERS: { name: 'Build Orders', disabled: false, active: false, icon: 'fa fa-list-ol' },
        PLAY_OVERLAY_CONFIG: { name: 'Player Overlay', disabled: false, active: false, icon: 'fa fa-gamepad' },
        OBS_OVERLAY_CONFIG: { name: 'Obs/Replay Overlay', disabled: false, active: false, icon: 'fa fa-desktop' },
        EVENTSYSTEM: { name: 'Stream-Automation', disabled: true, active: false, hide: true, icon: 'fa fa-robot' },
        SUBSCRIPTION: { name: 'Username', disabled: false, active: false, hide: true, icon: 'fa fa-user' },
        RECORDER: { name: 'State', disabled: false, active: false, hide: true, icon: 'fa fa-circle' },
    };

    @ViewChild('logScrollContainer') private logScrollContainer: ElementRef;

    @ViewChild('paypalForward') private paypalModal: any;

    public paypalUiTitle = 'Opening PayPal...';
    public paypalUiText = 'Preparing your PayPal checkout in the background.';
    public paypalUiCanCancel = true;
    public paypalUiStep: 'confirm' | 'starting' = 'confirm';


    private scrollBottomActive = false;
    private w3blib = null;
    private w3blibc_32 = null;
    private w3blibc_64 = null;
    private w3blib_64 = null;
    private logPipeServer = null;
    private dataPipeServer = null;
    private updateIsRequired = false;
    private localUpdates = [];
    private localBuildOrderState = '';
    private localWSS: WSServer = undefined;
    private localServerUrls = [];
    private w3IntegrationServer: WSServer = undefined;
    private matchUpdateWss: ReconnectingWebSocket;
    private overlayWindow: Electron.BrowserWindow = null;

    private paypalModalRef: NgbModalRef | null = null;
    private readonly PAYPAL_PENDING_STATE_KEY = 'PAYPAL_PENDING_STATE';
    private readonly STRIPE_PENDING_STATE_KEY = 'STRIPE_PENDING_STATE';
    private readonly BUILD_ORDER_STORAGE_KEY = 'W3BOOSTER_BUILD_ORDERS';
    private readonly BUILD_ORDER_SELECTED_KEY = 'W3BOOSTER_SELECTED_BUILD_ORDER';
    private readonly BUILD_ORDER_ACTIVE_KEY = 'W3BOOSTER_ACTIVE_BUILD_ORDER';
    private readonly BUILD_ORDER_STATE_TYPE = 'buildOrder';
    private paypalPendingItemId: string | null = null;
    private lastGameTimeSeconds = 0;


    constructor(protected node: NodeService, protected injector: Injector, private authenticatonService: AuthenticationService,
        private userService: UserService, private zone: NgZone, private http: HttpClient,
        private router: Router, private shopOrderService: ShopOrderService) {
        super(injector);
        this.updateRecorderState(ERecorderStates.INITIALIZING);
        // this.broadcastingServices.push(streamlabsService);
    }

    public handlePlayerOverlayToggle(attrib: keyof OverlaySettings, execute: boolean) {
        if (execute !== false) {
            (this.user.playerOverlaySettings[attrib] as boolean) = !this.user.playerOverlaySettings[attrib];
            this.user.playerOverlaySettings.save();
        }
    }

    public handleObsOverlayToggle(attrib: keyof OverlaySettings, execute: boolean) {
        if (execute !== false) {
            (this.user.obsOverlaySettings[attrib] as boolean) = !this.user.obsOverlaySettings[attrib];
            this.user.obsOverlaySettings.save();
        }
    }

    public handleSettingsToggle(setting: EUserSettingEnum, execute: boolean) {
        if (execute !== false) {
            this.user.settings[setting] = !this.user.settings[setting];
            this.user.save();
        }
    }

    public async ngOnInit() {
        this.isDesktopClient = this.node.isAvailable();
        this.mainMenuTabs.RECORDER.disabled = !this.isDesktopClient;
        this.loadBuildOrders();
        this.configureNormalDashboardWindow();

        if (this.getPaypalPendingState()) {
            this.router.navigate(['/payment']);
            return;
        }

        if (!environment.production && this.isDesktopClient) {
            this.switchTab(this.mainMenuTabs, this.mainMenuTabs.RECORDER)
        }

        if (environment.version !== localStorage.getItem('LAST_VERSION')) {
            this.versionIsNew = true;
            localStorage.setItem('LAST_VERSION', environment.version);
        }

        if (localStorage.getItem('MATCH_SCORE')) {
            this.matchScore = JSON.parse(localStorage.getItem('MATCH_SCORE'));
        }

        if (localStorage.getItem('COMPACT_DASHBOARD')) {
            this.showCompactDashboard = JSON.parse(localStorage.getItem('COMPACT_DASHBOARD'));
        }

        this.onGameTimeChanged("");
        this.onMatchScoreChanged();
        this.checkMatchSessionBeingOverdue();

        setInterval(this.checkMatchSessionBeingOverdue.bind(this), 60000);

        for (const countryCode of Object.keys(countries)) {
            this.countries.push({ code: countryCode.toLowerCase(), label: countries[countryCode] });
        }
        this.countries.sort((a, b) => 0 - (a.label > b.label ? -1 : 1));

        for (const tabKey of Object.keys(this.mainMenuTabs)) {
            if (this.mainMenuTabs[tabKey].privilege) {
                this.mainMenuTabs[tabKey].hide = true;
            }
        }

        this.userService.getCurrentUser().then(async user => {
            while (!user.broadcasterSecret) {
                user = await this.userService.getCurrentUser();
            }



            this.user = user;
            console.log(this.user);

            //connect to server
            const configuredMatchUpdateWssUrl = (this.environment as any).MATCH_UPDATE_WSS_URL;
            const matchUpdateWssBaseUrl = configuredMatchUpdateWssUrl || 'wss://' + (((window.location.hostname.indexOf('localhost') >= 0) ? 'localhost:25081' : 'overlay.w3booster.com:14970'));
            const matchUpdateWssUrl = matchUpdateWssBaseUrl + "/client?userId=" + this.user.id;
            this.matchUpdateWss = new ReconnectingWebSocket(matchUpdateWssUrl);
            let initialOpened = false
            console.log(this.matchUpdateWss);
            this.matchUpdateWss.onopen = () => {
                if (initialOpened && [ERecorderStates.GAME_STARTED, ERecorderStates.GAME_RUNNING].indexOf(this.recorderState.key) >= 0) {
                    this.w3blib.RestartGame()
                    //this.node.ipcRenderer.sendSync('restart-app');
                    //if(this.recorderState == ERecorderStates.GAME_RUNNING)
                }
                initialOpened = true;
            }

            // migrate old settings
            if (this.user.get("overlaySettings")) {
                const overlaySettings = this.user.get("overlaySettings")
                for (const key of Object.keys(overlaySettings)) {
                    if (key != "id") {
                        this.user.playerOverlaySettings[key] = overlaySettings[key];
                        this.user.obsOverlaySettings[key] = overlaySettings[key];
                    }
                }
                this.user.playerOverlaySettings.save();
                this.user.obsOverlaySettings.save();
                overlaySettings.destroy();
                this.user["_overlaySettings"] = null;
                this.user.save();
            }

            if (!this.user.playerOverlaySettings.id) {
                this.user.playerOverlaySettings.save();
                await this.user.save();
            }

            if (!this.user.obsOverlaySettings.id) {
                this.user.obsOverlaySettings.save();
                await this.user.save();
            }

            /*
            for (const broadcastingService of this.broadcastingServices) {
                console.warn(this.user.eventsystemConfigs);
                broadcastingService.whenAvailable().then(() => {
                    broadcastingService.setEventsystemConfig(this.user.eventsystemConfigs[broadcastingService.targetType]);
                });
            }

            this.streamlabsService.whenAvailable().then(() => {
                this.streamlabsService.handleGameEvent(EEventsystemConfigRuleTriggerType.WC3_ENDED);
                this.streamlabsService.fetchSources().then(sceneArray => {
                    console.warn(sceneArray);
                });
            });
*/
            /*
                        const rule = new EventsystemConfigRule();
                        rule.trigger = new EventsystemConfigRuleTrigger(EEventsystemConfigRuleTriggerType.WC3_ENDED);
                        const action = new EventsystemConfigRuleActions.SwitchSourceVisibility();
                        action.sceneId = "scene_d19ad257-1ee3-4639-98b6-96e5f0146883";
                        action.sourceId = "7fcc1808-9db0-4c39-a613-c18bd6987cae";
                        action.operation = EEventsystemActionSourceVisibility.HIDE;
                        action.duration = 20;
                        rule.actions.push(action)
                        this.user.eventsystemConfigs[EEventsystemConfigTarget.STREAMLABS].rules = new Array();
                        this.user.eventsystemConfigs[EEventsystemConfigTarget.STREAMLABS].rules.push(rule);
                        this.user.eventsystemConfigs[EEventsystemConfigTarget.STREAMLABS].save();
            */
            // (this.user.eventsystemConfigs[EEventsystemConfigTarget.OBS].rules[0].actions[0] as any).duration = -1;
            // this.user.eventsystemConfigs[EEventsystemConfigTarget.OBS].save();


            // this.user.eventsystemConfigs.destroy();
            // this.user.save();
            // console.warn(this.user.eventsystemConfigs.obsConfig.rules);
            // this.user.eventsystemConfigs.obsConfig.rules.push(new EventsystemConfigRule());
            // this.user.eventsystemConfigs.save();
            // this.user.save();
            // this.user.eventsystemConfigs.save();

            this.overlayUrl = 'https://overlay.w3booster.com/?channel=' + this.user.id + '&secret=' + user.broadcasterSecret + '&no-cache=' + this.Math.random();
            if (!this.environment.production) {
                this.overlayUrl = 'http://localhost:8080/?channel=' + this.user.id + '&secret=' + user.broadcasterSecret;
            }


            this.userService.subById(this.user.id).then(userSub => {
                userSub.onNext((update) => {
                    const updatedUser = update.state.get(this.user.id);
                    if (user && this.user.plan !== updatedUser.plan) {
                        this.zone.run(() => {
                            this.user.plan = updatedUser.plan;
                            this.user.planUntil = updatedUser.planUntil;
                        });
                    }

                    if (user && this.user.discordUserData !== updatedUser.discordUserData) {
                        this.zone.run(() => {
                            this.user.discordUserData = updatedUser.discordUserData;
                        });
                    }
                });
            });

            this.updateMatchScoreAutomatically = this.user.getSetting(EUserSettingEnum.UPDATE_MATCH_SCORE_AUTOMATICALLY, true);
            for (const tabKey of Object.keys(this.mainMenuTabs)) {
                if (this.mainMenuTabs[tabKey].privilege) {
                    this.mainMenuTabs[tabKey].hide = !this.authenticatonService.hasPrivilege(this.mainMenuTabs[tabKey].privilege);
                }
            }

            if (this.isDesktopClient) {
                this.osVersion = Number(this.node.os.release().split('.')[0]);
                if (this.osVersion < 10) {
                    if (this.user.playerOverlaySettings.ingameOverlayEnabled) {
                        this.user.playerOverlaySettings.ingameOverlayEnabled = false;
                        this.user.playerOverlaySettings.save();
                    }
                    if (this.user.obsOverlaySettings.ingameOverlayEnabled) {
                        this.user.obsOverlaySettings.ingameOverlayEnabled = false;
                        this.user.obsOverlaySettings.save();
                    }
                }

                await this.initLocalServer();
                //await this.initW3Integration();
                this.initRecorder();
                this.initIngameOverlay();

                setInterval(() => {
                    this.checkForUpdates();
                }, 300000);
                try {

                } catch (e) {
                    // this.errorMessage(e);
                }
            }
        });
    }

    ngAfterViewChecked() {
        this.scrollLogToBottom();
    }

    public switchTab(tabs, tab) {
        if (tab.disabled) {
            return;
        }
        for (const key of Object.keys(tabs)) {
            tabs[key].active = false;
        }
        tab.active = true;
    }

    private configureNormalDashboardWindow() {
        if (!this.node.isAvailable()) {
            return;
        }

        const mainWin = this.node.remote.getCurrentWindow() as any;
        mainWin.setResizable(true);
        mainWin.setMinimumSize(1024, 640);
        mainWin.setMaximumSize(10000, 10000);
    }

    private initRecorder(plattform = null, useReforged = true) {
        this.updateRecorderState(ERecorderStates.INITIALIZING);

        const pipeBasePath = '\\\\.\\pipe\\';
        const recorderLogPipe = 'W3Booster.RecorderLog';
        const recorderDataPipe = 'W3Booster.RecorderData';
        const workingDir = this.node.ipcRenderer.sendSync('get-working-dir') + this.node.path.sep + 'current' + this.node.path.sep;
        process.env['PATH'] = `${process.env.PATH};${workingDir}`;
        const useX86Lib = (plattform && plattform === 'x86');
        if (useX86Lib) {
            if (!this.w3blibc_32) {
                this.w3blibc_32 = this.node.ffi.Library('w3blibc-32.dll', {
                    'InitializeRecorder': [this.node.ref.types.void, [this.node.ref.types.bool]],
                    'SetRecorderSettings': [this.node.ref.types.int, [this.node.ref.types.CString]],
                    'StartRecorder': [this.node.ref.types.void, []],
                    'StopRecorder': [this.node.ref.types.void, []]
                });
            }
            this.w3blib = this.w3blibc_32;
        } else {
            if (useReforged) {
                if (!this.w3blib_64) {
                    this.w3blib_64 = this.node.ffi.Library('w3blib.dll', {
                        'InitializeRecorder': [this.node.ref.types.void, [this.node.ref.types.bool]],
                        'SetRecorderSettings': [this.node.ref.types.int, [this.node.ref.types.CString]],
                        'StartRecorder': [this.node.ref.types.void, []],
                        'StopRecorder': [this.node.ref.types.void, []],
                        'RestartGame': [this.node.ref.types.void, []],
                        'GetW3HWND': [this.node.ref.types.int, []],
                        'SetPro': [this.node.ref.types.void, [this.node.ref.types.bool]]
                    });
                }
                this.w3blib = this.w3blib_64;
            } else {
                if (!this.w3blibc_64) {
                    this.w3blibc_64 = this.node.ffi.Library('w3blibc.dll', {
                        'InitializeRecorder': [this.node.ref.types.void, [this.node.ref.types.bool]],
                        'SetRecorderSettings': [this.node.ref.types.int, [this.node.ref.types.CString]],
                        'StartRecorder': [this.node.ref.types.void, []],
                        'StopRecorder': [this.node.ref.types.void, []]
                    });
                }
                this.w3blib = this.w3blibc_64;
            }
        }

        if (!this.logPipeServer) {
            this.logPipeServer = this.node.net.createServer((stream) => {
                stream.on('data', (c) => {
                    this.zone.run(() => {
                        const text = c.toString();
                        this.recorderLog += text;
                        if (this.logScrollContainer) {
                            const raw = this.logScrollContainer.nativeElement;
                            this.scrollBottomActive = (raw.scrollTop + raw.offsetHeight) === raw.scrollHeight;
                        }
                    });
                });
            });

            this.logPipeServer.listen(pipeBasePath + recorderLogPipe, function () {
                console.warn('Recorder-Log-Pipe created!');
            });
        }

        if (!this.dataPipeServer) {
            this.dataPipeServer = this.node.net.createServer((stream) => {
                let dataBuffer: Buffer = null;
                stream.on('data', (c) => {
                    dataBuffer = !dataBuffer ? c : Buffer.concat([dataBuffer, c]);
                    while (dataBuffer.length > 5) {
                        const type = dataBuffer.readInt8(0);
                        const messageLength = dataBuffer.readUInt32LE(1);
                        if (dataBuffer.length < 5 + messageLength) {
                            break;
                        }
                        this.processIncomingMessage(type, dataBuffer.slice(5, messageLength + 5));
                        dataBuffer = dataBuffer.slice(messageLength + 5);
                    }
                });
            });

            this.dataPipeServer.listen(pipeBasePath + recorderDataPipe, function () {
                console.warn('Recorder-Data-Pipe created!');
            });
        }

        this.w3blib.SetRecorderSettings(JSON.stringify({
            'logToConsole': false,
            'dataPipe': recorderDataPipe,
            'logPipe': recorderLogPipe
        }));

        this.w3blib.InitializeRecorder(true);
        this.w3blib.SetPro(this.user.isProPlan());
        try {
            this.w3blib.StartRecorder.async(() => {
                console.warn('recorder closed');
            });
        } catch (e) {

        }
    }

    public scrollLogToBottom(): void {
        try {
            if (this.scrollBottomActive) {
                this.logScrollContainer.nativeElement.scrollTop = this.logScrollContainer.nativeElement.scrollHeight;
                this.scrollBottomActive = false;
            }
        } catch (err) {
        }
    }

    public getTeamsSorted() {
        if ((this.currentMatch?.isReplay || this.currentMatch?.isObserver) && this.currentMatch.teams.length == 2) {
            const playerCount = this.currentMatch.teams.map(t => t.members.length).reduce((a, b) => a + b, 0);
            if (playerCount == 2) {
                const teams = this.currentMatch.teams.slice();
                if (teams[0].members[0].startPosition?.x > teams[1].members[0].startPosition?.x) {
                    teams.reverse();
                }

                if (this.user.obsOverlaySettings.reversePlayerOrder) {
                    teams.reverse();
                }

                return teams;
            }
        }
        return this.currentMatch.teams;
    }

    private async processIncomingMessage(type: ERecorderMessageType, messageBuffer: Buffer) {
        let message = messageBuffer.toString('ascii');
        if (type === ERecorderMessageType.REQUEST_ADMIN) {
            console.warn('ADMIN privileges required');
            this.node.ipcRenderer.sendSync('request-admin-privileges');
        } else if (type === ERecorderMessageType.SWITCH_PLATFORM) {
            const switchRequest = JSON.parse(message);
            console.warn('Switching library: ' + JSON.stringify(switchRequest));
            this.initRecorder(switchRequest.architecture, switchRequest.reforged);
        } else if (type === ERecorderMessageType.MATCHUP) {
            const match = JSON.parse(message);
            if (match.hasOwnProperty('isWon')) {
                if (!match.isReplay && !match.isObserver) {
                    const isBadPingW3CGame = match.realm.toLowerCase().startsWith("w3champions") && match.gameTime <= 120 && !match.isWon;

                    const entry = this.matchHistory.find((e) => e.id === match.id);
                    if (entry) {
                        entry.result = ((isBadPingW3CGame) ? -1 : ((match.isWon) ? 1 : 2));
                    }

                    if (this.updateMatchScoreAutomatically && !entry.hasAIMembers && !isBadPingW3CGame) {
                        this.changeMatchScore(match.isWon, true);
                    }
                }

                this.currentMatch = null;
            } else {
                /*                match.game.name = decodeURIComponent(match.game.name);
                                match.game.creator = decodeURIComponent(match.game.creator);
                                match.game.map = decodeURIComponent(match.game.map);
                                */
                for (const index of Object.keys(match.players)) {
                    match.players[index].name = decodeURIComponent(match.players[index].name);
                }
                this.zone.run(() => {
                    this.currentMatch = this.createMatchFromMatchInfo(match);
                    if (this.user.obsOverlaySettings.reversePlayerOrder) {
                        this.handleObsOverlayToggle('reversePlayerOrder', true);
                    }

                    this.matchHistory.unshift(this.currentMatch);
                    this.autoSelectBuildOrderForCurrentMatch();
                    //request stats
                    /*
                    if (match.realm.toLowerCase() == "reforged") {
                        for (let member of ([].concat.apply([], this.currentMatch.teams.map(t => t.members)) as Array<ITeamMember>).filter(m => !m.isAI)) {
                            this.requestW3PlayerStats(member.name);
                        }
                    }
                    */
                });
            }
        } else if (type === ERecorderMessageType.LOCAL_GAMEDATA) {
            this.localUpdates.push(message);
            this.localWSS.clients.forEach(c => {
                c.send(message);
            });
            this.evaluateBuildOrderFromGameData(message);
        } else if (type === ERecorderMessageType.GAMETIME) {
            const gameTime = Number(message);
            this.onGameTimeChanged(gameTime)
            this.updateBuildOrderTiming(gameTime);
        } else {
            if (type === ERecorderMessageType.RECORDER_STATE) {
                this.updateRecorderState(Number(message));
                this.checkForUpdates();
            } else if (type === ERecorderMessageType.LOCAL_MATCHUP) {
                const msg = JSON.parse(message);
                for (const upd of msg) {
                    if (upd.class = 'W3Game') {
                        upd['localServerUrls'] = this.localServerUrls;
                    }
                }
                message = JSON.stringify(msg);
                this.localUpdates = [];
            }
            let success = false;
            let trys = 0;
            while (!success && trys < 3) {
                try {
                    // await Parse.Cloud.run('matchUpdate', { data: message, type: type });
                    if (type !== ERecorderMessageType.PING) {
                        this.matchUpdateWss.send(JSON.stringify({ data: message, type: type }));
                        //await this.http.post(this.environment.REST_URL + 'w3alias/matchUpdate/' + this.user.id, { data: message, type: type }, { responseType: 'text' }).toPromise();
                    }
                    success = true;
                } catch (e) {
                    trys++;
                    console.warn('Update issue, retrying');
                    console.warn(e);
                }
            }
        }
    }

    public resetMatchScore() {
        this.matchScore = { wins: 0, losses: 0, lastUpdate: new Date().getTime() };
        this.onMatchScoreChanged();
    }

    public changeMatchScore(win: boolean, add: boolean) {
        if (win) {
            this.matchScore.wins += ((add) ? 1 : -1);
        } else {
            this.matchScore.losses += ((add) ? 1 : -1);
        }
        this.matchScore.lastUpdate = new Date().getTime();

        if (this.matchScore.wins < 0) {
            this.matchScore.wins = 0;
        }

        if (this.matchScore.losses < 0) {
            this.matchScore.losses = 0;
        }
        this.onMatchScoreChanged();
    }

    private checkMatchSessionBeingOverdue() {
        const maxDelayTime = 1000 * 60 * 60 * 5;
        if (new Date().getTime() - this.matchScore.lastUpdate > maxDelayTime) {
            this.resetMatchScore();
        }
    }

    private onMatchScoreChanged() {
        if (this.node.isAvailable()) {
            let workingDir = this.node.ipcRenderer.sendSync('get-working-dir');
            workingDir = workingDir.substr(0, workingDir.length - 4) + this.node.path.sep + 'score';
            if (!this.node.fs.existsSync(workingDir)) {
                this.node.fs.mkdirSync(workingDir);
            }
            this.matchScoreWinsFilePath = workingDir + this.node.path.sep + 'wins.txt';
            this.matchScoreLossFilePath = workingDir + this.node.path.sep + 'losses.txt';
            this.node.fs.writeFileSync(this.matchScoreWinsFilePath, String(this.matchScore.wins));
            this.node.fs.writeFileSync(this.matchScoreLossFilePath, String(this.matchScore.losses));
        }
        localStorage.setItem('MATCH_SCORE', JSON.stringify(this.matchScore));
        Parse.Cloud.run('matchUpdate', { data: this.matchScore, type: ERecorderMessageType.MATCHSCORE });
    }

    private onGameTimeChanged(gameTime: number | string) {
        if (this.node.isAvailable()) {
            let workingDir = this.node.ipcRenderer.sendSync('get-working-dir');
            workingDir = workingDir.substr(0, workingDir.length - 4) + this.node.path.sep + 'embed';
            if (!this.node.fs.existsSync(workingDir)) {
                this.node.fs.mkdirSync(workingDir);
            }
            this.gameTimeFilePath = workingDir + this.node.path.sep + 'gametime.txt';
            if (gameTime != "") {
                const minutes = Math.floor(Number(gameTime) / 60);
                const seconds = Number(gameTime) % 60;
                gameTime = minutes + ":" + (seconds < 10 ? '0' + seconds : seconds);
            }
            this.gameTime = gameTime;
            this.node.fs.writeFileSync(this.gameTimeFilePath, gameTime);
        }
    }

    private checkForUpdates() {
        if (!this.updateIsRequired && (!this.recorderState || (this.recorderState.key !== ERecorderStates.GAME_RUNNING && this.recorderState.key !== ERecorderStates.GAME_STARTED))) {
            if (this.node.ipcRenderer.sendSync('is-patching-required')) {
                this.updateIsRequired = true;
                this.node.ipcRenderer.sendSync('show-dialog', 'info', 'Update available, restart required', ['ok'], 'An update of W3Booster is available.\r\nW3Booster is restarting now...');
                this.node.ipcRenderer.sendSync('restart-app');
            }
        }
    }


    // tslint:disable-next-line:member-ordering
    readonly recorderStates = new Map<ERecorderStates, RecorderState>()
        .set(ERecorderStates.UNEXPECTED_EXCEPTION, {
            key: ERecorderStates.UNEXPECTED_EXCEPTION,
            title: 'Unexpected Error',
            subtitle: 'W3Booster stopped, please check log...',
            color: '#eb291a'
        })
        .set(ERecorderStates.INITIALIZING, {
            key: ERecorderStates.INITIALIZING,
            title: 'Initializing',
            subtitle: 'W3Booster is booting...',
            color: '#ccc'
        }).set(ERecorderStates.INITIALIZED, {
            key: ERecorderStates.INITIALIZED,
            title: 'Initializing',
            subtitle: 'W3Booster is ready...',
            color: '#ccc'
        }).set(ERecorderStates.PRE_W3_LOOKUP, {
            key: ERecorderStates.PRE_W3_LOOKUP,
            title: 'Initializing',
            subtitle: 'Looking up for Warcraft III...',
            color: '#ccc'
        }).set(ERecorderStates.WAITING_FOR_W3, {
            key: ERecorderStates.WAITING_FOR_W3,
            title: 'Warcraft III not running',
            subtitle: 'Waiting for Warcraft III to start...',
            color: '#ebc11a'
        }).set(ERecorderStates.WAITING_FOR_64BIT_W3, {
            key: ERecorderStates.WAITING_FOR_64BIT_W3,
            title: 'Warcraft III not running',
            subtitle: 'Waiting for Warcraft III to start...',
            color: '#ebc11a'
        }).set(ERecorderStates.ANALYZING_W3, {
            key: ERecorderStates.ANALYZING_W3,
            title: 'Reading Warcraft III',
            subtitle: 'W3Booster is preparing...',
            color: '#ebc11a'
        }).set(ERecorderStates.ADMIN_REQUIRED, {
            key: ERecorderStates.ADMIN_REQUIRED,
            title: 'W3Booster Restart Required',
            subtitle: 'Admin privileges required...',
            color: '#ae081b'
        }).set(ERecorderStates.PRE_GAME_LOOKUP, {
            key: ERecorderStates.PRE_GAME_LOOKUP,
            title: 'Looking for running games',
            subtitle: 'W3Booster is looking up for running games...',
            color: '#08ae71'
        }).set(ERecorderStates.WAITING_FOR_GAME, {
            key: ERecorderStates.WAITING_FOR_GAME,
            title: 'Ready',
            subtitle: 'Waiting for a game to start...',
            color: '#08ae71'
        }).set(ERecorderStates.GAME_STARTING, {
            key: ERecorderStates.GAME_STARTING,
            title: 'Game start detected',
            subtitle: 'Looking up game information...',
            color: '#ebc11a'
        }).set(ERecorderStates.GAME_STARTED, {
            key: ERecorderStates.GAME_STARTED,
            title: 'Game running',
            subtitle: 'Processing game, overlay visible...',
            color: '#08ae71'
        }).set(ERecorderStates.GAME_RUNNING, {
            key: ERecorderStates.GAME_RUNNING,
            title: 'Game running',
            subtitle: 'Processing game, overlay visible...',
            color: '#08ae71'
        }).set(ERecorderStates.GAME_ENDED, {
            key: ERecorderStates.GAME_ENDED,
            title: 'Game ended',
            subtitle: 'Collecting gameresult...',
            color: '#08ae71'
        }).set(ERecorderStates.RECORDER_STOPS, {
            key: ERecorderStates.RECORDER_STOPS,
            title: 'W3Booster analyzer shuts down',
            subtitle: 'Analyzer shutdown in progress',
            color: '#eb291a'
        });

    private updateRecorderState(newState: ERecorderStates) {
        const newStateObject = this.recorderStates.get(newState);
        if (newStateObject && this.recorderState !== newStateObject) {
            this.zone.run(() => {
                this.recorderState = newStateObject;
            });

            switch (newState) {
                case ERecorderStates.ANALYZING_W3: {
                    this.sendEventToBroadcasters(EEventsystemConfigRuleTriggerType.WC3_STARTED);
                    this.closeOpenIngameOverlay();
                } break;
                case ERecorderStates.WAITING_FOR_W3: {
                    this.sendEventToBroadcasters(EEventsystemConfigRuleTriggerType.WC3_ENDED);
                } break;

                case ERecorderStates.WAITING_FOR_GAME: {
                    this.onGameTimeChanged("")
                } break;

                case ERecorderStates.GAME_STARTED: {
                    this.w3blib.SetPro(this.user.isProPlan());
                    this.sendEventToBroadcasters(EEventsystemConfigRuleTriggerType.GAME_STARTED);
                } break;

                case ERecorderStates.GAME_ENDED: {
                    this.onGameTimeChanged("")
                    this.sendEventToBroadcasters(EEventsystemConfigRuleTriggerType.GAME_ENDED);
                } break;
            }
        }
    }

    private createMatchFromMatchInfo(matchInfo): IMatch {
        const match: IMatch = {
            id: matchInfo.id,
            result: 0,
            isReplay: matchInfo.isReplay,
            isObserver: matchInfo.isObserver,
            time: new Date(),
            map: (matchInfo.game && matchInfo.game.map) ? matchInfo.game.map.split('/').reverse()[0].split('\\').reverse()[0].replace(/\.w3[xm]{1}/g, '').replace(/([A-Z]{1}[a-z])/g, ' $1').replace(/\([0-9]+\)/g, '').replace(/[\_\-]/g, ' ').trim() : undefined,
            teams: new Array(),
            hasAIMembers: false

        };
        const teamMembersMap = new Map<string, Array<ITeamMember>>();
        const playerIds = Object.keys(matchInfo.players);
        if (playerIds.length > 0) {
            playerIds.splice(playerIds.indexOf(String(matchInfo.broadcasterId)), 1);
            playerIds.unshift(matchInfo.broadcasterId);
            for (const playerId of playerIds) {
                const player = matchInfo.players[playerId];
                if (player.team == 24) {
                    continue;
                }
                let teamMembers = teamMembersMap.get(player.team);
                if (!teamMembers) {
                    teamMembers = new Array();
                    teamMembersMap.set(player.team, teamMembers);
                }
                const member = {
                    name: player.name,
                    race: raceNames.get(player.race),
                    color: player.color_id,
                    stats: undefined,
                    main: undefined,
                    isAI: player.isAI,
                    startPosition: player.startPosition
                };

                if (player.isAI) {
                    match.hasAIMembers = true;
                }

                teamMembers.push(member);

                if (matchInfo.realm !== 'Reforged' && !(!player || player.computer || (matchInfo.realm === 'Netease' && !player.neteaseId)) && playerIds.length === 2) {
                    console.warn(member);
                    const userId = (matchInfo.realm === 'Netease') ? player.neteaseId : member.name.replace('#', '%23');
                    const url = this.environment.REST_URL + 'w3stats/' + matchInfo.realm + '/' + player.race + '?userid=' + userId;
                    this.http.get(url).subscribe((stats: IPlayerStats) => {
                        member.stats = (stats && stats.solo) ? stats.solo : null;
                    });

                    this.http.get(this.environment.REST_URL + 'w3alias/' + matchInfo.realm + '?userid=' + member.name).subscribe((main: IMainAccount) => {
                        member.main = main;
                    });

                } else {
                    member.stats = null;
                }
            }
        }

        match.teams = new Array();
        for (const teamId of Array.from(teamMembersMap.keys())) {
            match.teams.push({ id: Number(teamId), members: teamMembersMap.get(teamId) });
        }

        return match;
    }

    public getProAccountDate(days) {
        let myDate = new Date();
        if (this.user.isProPlan() && this.user.planUntil) {
            myDate = new Date(this.user.planUntil);
        }
        myDate.setDate(myDate.getDate() + days);
        return this.getLocalizedDate(myDate);
    }

    public afterIngameIntegrationToggle() {
        if (this.user.playerOverlaySettings.ingameOverlayEnabled || this.user.obsOverlaySettings.ingameOverlayEnabled) {
            this.initIngameOverlay();
        } else {
            this.closeOpenIngameOverlay()
        }
    }

    public toggleDashboardMode() {
        this.showCompactDashboard = !this.showCompactDashboard;
        localStorage.setItem('COMPACT_DASHBOARD', JSON.stringify(this.showCompactDashboard));
    }

    public connectDiscord() {
        const discordUrl = 'https://discord.com/api/oauth2/authorize?client_id=821393908172324945&redirect_uri=http%3A%2F%2Fw3booster.com%2Fdiscord-connect&response_type=code&scope=identify';
        if (!this.node.isAvailable()) {
            window.open(discordUrl, '_blank');
            return;
        }

        this.loadingScreen = true;
        const authWindow = new this.node.remote.BrowserWindow({
            width: 500,
            height: 740,
            frame: true,
            resizable: false,
            minimizable: false,
            parent: this.node.remote.BrowserWindow.getFocusedWindow(),
            title: "Connect W3Booster with Discord",
            modal: true,
            webPreferences: {
                nodeIntegration: false
            }
        });

        authWindow.loadURL(discordUrl);
        authWindow.webContents.on('will-navigate', (e, url) => {
            if (url.indexOf('http://w3booster.com/discord-connect?') == 0) {
                const parsedUrl = new URL(url);
                const code = parsedUrl.searchParams.get('code');
                authWindow.close();
                if (code) {
                    this.userService.connectDiscord(code).then(res => {
                        this.zone.run(() => {
                            this.successMessage("Connected to Discord")
                            this.loadingScreen = false;
                        })
                    });
                } else {
                    this.zone.run(() => {
                        this.loadingScreen = false;
                    })
                }
            }
        })
    }

    public disconnectDiscord() {
        this.loadingScreen = true;
        this.userService.disconnectDiscord().then(res => {
            this.zone.run(() => {
                this.successMessage("Disconnected from Discord")
                this.loadingScreen = false;
            })
        });
    }

    public osBrowser(url: string) {
        if (this.node.isAvailable()) {
            this.node.child_process.execSync('start ' + url);
        } else {
            window.open(url, '_blank');
        }
    }

    public buyItem(itemId: string) {
        this.paypalPendingItemId = itemId;
        this.paypalUiStep = 'confirm';
        this.paypalUiTitle = 'Continue with PayPal?';
        this.paypalUiText = 'PayPal will be opened in your default browser to complete the payment.';
        this.paypalUiCanCancel = true;
        this.openPaypalModal();
        return false;
    }

    public buyItemStripe(itemId: string) {
        const state = crypto['randomUUID']();
        this.setPendingState(this.STRIPE_PENDING_STATE_KEY, state);
        const returnTo = this.node.isAvailable() ? '' : window.location.origin + '/payment';
        this.shopOrderService.CreateStripeCheckout(itemId, state, returnTo).then(url => {
            if (this.node.isAvailable()) {
                this.node.remote.shell.openExternal(url);
                this.router.navigate(['/payment']);
            } else {
                window.location.href = url;
            }
        }).catch((e) => {
            localStorage.removeItem(this.STRIPE_PENDING_STATE_KEY);
            this.errorMessage((e?.message) ? e.message : 'Stripe checkout could not be started.');
        });
        return false;
    }

    public continuePaypalProcess(modal: any) {
        if (!this.paypalPendingItemId) {
            return;
        }

        const state = crypto['randomUUID']();
        this.setPaypalPendingState(state);

        this.paypalUiStep = 'starting';
        this.paypalUiTitle = 'Starting PayPal payment';
        this.paypalUiText = 'We are preparing your PayPal checkout. A browser window will open.';
        this.paypalUiCanCancel = true;

        this.shopOrderService.CreateOrder(this.paypalPendingItemId, state).then(url => {
            if (this.node.isAvailable()) {
                this.node.remote.shell.openExternal(url);
                modal?.close();
                this.router.navigate(['/payment']);
            } else {
                // Web fallback
                window.location.href = url;
            }
        }).catch((e) => {
            // If we couldn't even start, forget the pending state.
            localStorage.removeItem(this.PAYPAL_PENDING_STATE_KEY);
            this.paypalUiStep = 'confirm';
            this.paypalUiTitle = 'PayPal could not be started';
            this.paypalUiText = (e?.message) ? e.message : 'Please try again.';
        });
    }

    private openPaypalModal() {
        try {
            this.paypalModalRef = this.injector.get(NgbModal).open(this.paypalModal, { backdropClass: 'ce-backdrop', backdrop: 'static', keyboard: false });
            this.paypalModalRef.result.finally(() => {
                this.paypalModalRef = null;
            });
        } catch {
            // ignore
        }
    }

    public cancelPaypalProcess(modal: any) {
        // Stops the process and forgets the pending state.
        localStorage.removeItem(this.PAYPAL_PENDING_STATE_KEY);
        this.paypalPendingItemId = null;
        modal?.close();
    }

    private getPaypalPendingState(): string | null {
        const raw = localStorage.getItem(this.PAYPAL_PENDING_STATE_KEY);
        if (!raw) {
            return null;
        }

        // Backwards compat: used to be a plain state string.
        if (raw[0] !== '{') {
            return raw;
        }

        try {
            const parsed = JSON.parse(raw);
            if (parsed?.state) {
                return String(parsed.state);
            }
        } catch {
            // ignore
        }
        return null;
    }

    private setPaypalPendingState(state: string) {
        this.setPendingState(this.PAYPAL_PENDING_STATE_KEY, state);
    }

    private setPendingState(storageKey: string, state: string) {
        localStorage.setItem(storageKey, JSON.stringify({ state, createdAt: Date.now() }));
    }

    private closeOpenIngameOverlay() {
        if (this.node.isAvailable() && this.overlayWindow) {
            if (!this.environment.production && this.overlayWindow.webContents.isDevToolsOpened()) {
                this.overlayWindow.webContents.closeDevTools();
            }
            this.overlayWindow.close();
            this.overlayWindow = undefined;
        }
    }

    private initIngameOverlay() {
        if ((this.user.playerOverlaySettings.ingameOverlayEnabled || this.user.obsOverlaySettings.ingameOverlayEnabled) && !this.overlayWindow) {
            /*
            const msgType = ref.types.void;
            const msgPtr = ref.refType(msgType);
*/

            const user32 = this.node.ffi.Library('user32.dll', {
                FindWindowA: ['long', ['long', 'string']],
                SetParent: ['long', ['long', 'long']],
                GetWindowLongA: ['long', ['long', 'int']],
                SetWindowLongA: ['long', ['long', 'int', 'long']],
                /*GetForegroundWindow: ['int', []],
                SendMessageA: ['int32', ['long', 'int32', 'long', 'int32']],
                PeekMessageA: ['bool', [msgPtr, 'int', 'uint', 'uint', 'uint']],
                GetMessageA: ['bool', [msgPtr, 'int', 'uint', 'uint']],
                SetWinEventHook: ['int', ['int', 'int', 'pointer', 'pointer', 'int', 'int', 'int']],*/
            });

            this.waitForWc3Window().then((w3hwnd) => {
                /*
                if (!this.pfnWinEventProc) {
                    this.pfnWinEventProc = ffi.Callback('void', ['pointer', 'int', 'pointer', 'long', 'long', 'int', 'int'],
                        (hWinEventHook, event, hwndx, idObject, idChild, idEventThread, dwmsEventTime) => {
                            user32.SendMessageA(w3hwnd, 0x0006, 1, 0);
                        }
                    );

                    user32.SetWinEventHook(3, 3, null, this.pfnWinEventProc, 0, 0, 0 | 2);

                    setInterval(() => {
                        user32.PeekMessageA(ref.alloc(msgPtr), null, 0, 0, 1);
                    }, 50);
                }*/

                this.overlayWindow = new this.node.remote.BrowserWindow({
                    title: 'W3Booster Ingame Overlay',
                    frame: false,
                    transparent: true,
                    focusable: false,
                    show: false,
                    webPreferences: {
                        nodeIntegration: true,
                        contextIsolation: false
                    }
                });

                const hwnd = this.node.ref.types.int64.get(this.overlayWindow.getNativeWindowHandle(), 0);
                user32.SetParent(hwnd, w3hwnd);
                /*
                let exstyle = user32.GetWindowLongA(hwnd, -20);
                console.log('extstyle before: ' + exstyle);
                exstyle |= 0x00000020 | 0x00080000; // WS_EX_TRANSPARENT;
                console.log('extstyle after: ' + exstyle);
                user32.SetWindowLongA(hwnd, -20, exstyle);
                */
                this.overlayWindow.setSize(1920, 1080);
                if (!this.environment.production) {
                    this.overlayWindow.webContents.openDevTools();
                    // by setting forward to false, we cant hide ui elements but VS doesnt get laggy as hell when debugging.
                    this.overlayWindow.setIgnoreMouseEvents(true, { forward: false });
                }

                if (this.environment.production) {
                    this.overlayWindow.setIgnoreMouseEvents(true, { forward: true });
                }

                this.overlayWindow.loadURL(this.overlayUrl + '&w3hwnd=' + w3hwnd, { extraHeaders: 'pragma: no-cache\n' });
                this.overlayWindow.webContents.on('did-finish-load', () => {
                    this.overlayWindow.webContents.insertCSS('html,body{background-color:transparent !important;}');
                    this.overlayWindow.showInactive();
                    // overlayWindow.setEnabled(false);
                });

                this.overlayWindow.on('closed', () => {
                    this.overlayWindow = undefined;
                    console.log('window closed!');
                    this.initIngameOverlay();
                });
            }).catch(() => { });
        }
    }


    private waitForWc3Window() {
        return new Promise((res, rej) => {
            const interval = setInterval(() => {
                if (!(this.user.playerOverlaySettings.ingameOverlayEnabled || this.user.obsOverlaySettings.ingameOverlayEnabled)) {
                    clearInterval(interval);
                    rej();
                } else {
                    this.w3blib.GetW3HWND.async((err, w3hwnd) => {
                        if (!err && w3hwnd) {
                            clearInterval(interval);
                            res(w3hwnd);
                        }
                    });
                }
            }, 1000);
        });
    }

    public createBuildOrder() {
        const buildOrder = this.createDefaultBuildOrder('New Build Order');
        buildOrder.steps = [
            this.createBuildOrderStep(30, 'train', 'worker', 'Queue the next worker'),
            this.createBuildOrderStep(55, 'build', 'altar', 'Start hero tech')
        ];
        this.buildOrders.unshift(buildOrder);
        this.selectedBuildOrderId = buildOrder.id;
        this.saveBuildOrders();
    }

    public deleteSelectedBuildOrder() {
        if (this.buildOrders.length <= 1) {
            return;
        }
        this.buildOrders = this.buildOrders.filter(o => o.id !== this.selectedBuildOrderId);
        this.selectedBuildOrderId = this.buildOrders[0].id;
        if (this.activeBuildOrderId && !this.buildOrders.some(o => o.id === this.activeBuildOrderId)) {
            this.activeBuildOrderId = '';
        }
        this.saveBuildOrders();
        this.broadcastBuildOrderState();
    }

    public duplicateSelectedBuildOrder() {
        const selected = this.getSelectedBuildOrder();
        if (!selected) {
            return;
        }
        const clone = JSON.parse(JSON.stringify(selected)) as IBuildOrder;
        clone.id = this.createId('bo');
        clone.name = selected.name + ' copy';
        clone.visibility = 'private';
        clone.updatedAt = Date.now();
        clone.steps = clone.steps.map(step => ({ ...step, id: this.createId('step'), status: 'pending' as BuildOrderStepStatus, completedAtSeconds: undefined }));
        this.buildOrders.unshift(clone);
        this.selectedBuildOrderId = clone.id;
        this.saveBuildOrders();
    }

    public addBuildOrderStep() {
        const selected = this.getSelectedBuildOrder();
        if (!selected) {
            return;
        }
        const lastStep = selected.steps[selected.steps.length - 1];
        selected.steps.push(this.createBuildOrderStep((lastStep?.atSeconds ?? 0) + 30, 'custom', '', 'New checkpoint'));
        this.saveBuildOrders();
    }

    public removeBuildOrderStep(step: IBuildOrderStep) {
        const selected = this.getSelectedBuildOrder();
        if (!selected) {
            return;
        }
        selected.steps = selected.steps.filter(s => s.id !== step.id);
        this.saveBuildOrders();
        this.broadcastBuildOrderState();
    }

    public saveBuildOrders() {
        for (const order of this.buildOrders) {
            order.updatedAt = Date.now();
            order.steps.sort((a, b) => a.atSeconds - b.atSeconds);
        }
        localStorage.setItem(this.BUILD_ORDER_STORAGE_KEY, JSON.stringify(this.buildOrders));
        localStorage.setItem(this.BUILD_ORDER_SELECTED_KEY, this.selectedBuildOrderId);
        localStorage.setItem(this.BUILD_ORDER_ACTIVE_KEY, this.activeBuildOrderId);
        this.exportSelectedBuildOrder();
    }

    public activateSelectedBuildOrder() {
        const selected = this.getSelectedBuildOrder();
        if (!selected) {
            return;
        }
        this.activeBuildOrderId = selected.id;
        this.resetBuildOrderProgress(selected);
        this.saveBuildOrders();
        this.broadcastBuildOrderState();
    }

    public stopActiveBuildOrder() {
        this.activeBuildOrderId = '';
        localStorage.removeItem(this.BUILD_ORDER_ACTIVE_KEY);
        this.broadcastBuildOrderState();
    }

    public exportSelectedBuildOrder() {
        const selected = this.getSelectedBuildOrder();
        this.buildOrderShareCode = selected ? btoa(unescape(encodeURIComponent(JSON.stringify(selected)))) : '';
    }

    public importBuildOrder() {
        if (!this.buildOrderImportCode) {
            return;
        }
        try {
            const order = JSON.parse(decodeURIComponent(escape(atob(this.buildOrderImportCode)))) as IBuildOrder;
            order.id = this.createId('bo');
            order.visibility = 'private';
            order.updatedAt = Date.now();
            order.steps = (order.steps ?? []).map(step => ({
                ...step,
                id: this.createId('step'),
                atSeconds: Number(step.atSeconds) || 0,
                toleranceSeconds: Number(step.toleranceSeconds) || 10,
                status: 'pending' as BuildOrderStepStatus,
                completedAtSeconds: undefined
            }));
            this.buildOrders.unshift(order);
            this.selectedBuildOrderId = order.id;
            this.buildOrderImportCode = '';
            this.saveBuildOrders();
        } catch (e) {
            this.buildOrderImportCode = 'Invalid build order code';
        }
    }

    public getSelectedBuildOrder() {
        return this.buildOrders.find(o => o.id === this.selectedBuildOrderId);
    }

    public getActiveBuildOrder() {
        return this.buildOrders.find(o => o.id === this.activeBuildOrderId);
    }

    public getBuildOrderCompletion(order: IBuildOrder) {
        if (!order || order.steps.length === 0) {
            return 0;
        }
        return Math.round(order.steps.filter(s => s.status === 'done').length / order.steps.length * 100);
    }

    public formatBuildOrderTime(seconds: number) {
        seconds = Math.max(0, Number(seconds) || 0);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return minutes + ':' + remainingSeconds.toString().padStart(2, '0');
    }

    public parseBuildOrderTime(value: string) {
        if (!value) {
            return 0;
        }
        const parts = value.split(':').map(p => Number(p));
        if (parts.length === 1) {
            return parts[0] || 0;
        }
        return (parts[0] || 0) * 60 + (parts[1] || 0);
    }

    public updateBuildOrderStepTime(step: IBuildOrderStep, value: string) {
        step.atSeconds = this.parseBuildOrderTime(value);
        this.saveBuildOrders();
        this.broadcastBuildOrderState();
    }

    public getBuildOrderStatusLabel(step: IBuildOrderStep) {
        if (step.status === 'done') {
            return 'done at ' + this.formatBuildOrderTime(step.completedAtSeconds || 0);
        }
        if (step.status === 'late') {
            return 'late';
        }
        if (step.status === 'missed') {
            return 'missed';
        }
        if (step.status === 'active') {
            return 'now';
        }
        return 'queued';
    }

    private loadBuildOrders() {
        try {
            this.buildOrders = JSON.parse(localStorage.getItem(this.BUILD_ORDER_STORAGE_KEY) || '[]');
        } catch (e) {
            this.buildOrders = [];
        }

        if (this.buildOrders.length === 0) {
            const first = this.createDefaultBuildOrder('Human opener drill');
            first.race = 'human';
            first.matchup = 'any';
            first.description = 'Starter checklist. Replace the targets with exact game-data names once recorder mappings are finalized.';
            first.steps = [
                this.createBuildOrderStep(30, 'train', 'worker', 'Queue worker'),
                this.createBuildOrderStep(45, 'build', 'altar', 'Start Altar'),
                this.createBuildOrderStep(65, 'build', 'farm', 'Start first supply building')
            ];
            this.buildOrders = [first];
        }

        this.selectedBuildOrderId = localStorage.getItem(this.BUILD_ORDER_SELECTED_KEY) || this.buildOrders[0].id;
        if (!this.buildOrders.some(o => o.id === this.selectedBuildOrderId)) {
            this.selectedBuildOrderId = this.buildOrders[0].id;
        }
        this.activeBuildOrderId = localStorage.getItem(this.BUILD_ORDER_ACTIVE_KEY) || '';
        if (!this.buildOrders.some(o => o.id === this.activeBuildOrderId)) {
            this.activeBuildOrderId = '';
        }
        this.exportSelectedBuildOrder();
        this.broadcastBuildOrderState();
    }

    private createDefaultBuildOrder(name: string): IBuildOrder {
        return {
            id: this.createId('bo'),
            name,
            race: 'any',
            matchup: 'any',
            description: '',
            visibility: 'private',
            autoSelect: true,
            steps: [],
            updatedAt: Date.now()
        };
    }

    private createBuildOrderStep(atSeconds: number, action: BuildOrderAction, target: string, label: string): IBuildOrderStep {
        return {
            id: this.createId('step'),
            atSeconds,
            action,
            target,
            label,
            toleranceSeconds: 10,
            status: 'pending'
        };
    }

    private createId(prefix: string) {
        return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 8);
    }

    private resetBuildOrderProgress(order: IBuildOrder) {
        for (const step of order.steps) {
            step.status = 'pending';
            step.completedAtSeconds = undefined;
        }
    }

    private updateBuildOrderTiming(gameTime: number) {
        this.lastGameTimeSeconds = Number(gameTime) || 0;
        const active = this.getActiveBuildOrder();
        if (!active) {
            return;
        }

        let changed = false;
        for (const step of active.steps) {
            if (step.status === 'done') {
                continue;
            }
            const startsAt = step.atSeconds - step.toleranceSeconds;
            const lateAt = step.atSeconds + step.toleranceSeconds;
            const missedAt = lateAt + 20;
            const nextStatus: BuildOrderStepStatus = this.lastGameTimeSeconds > missedAt ? 'missed' : this.lastGameTimeSeconds > lateAt ? 'late' : this.lastGameTimeSeconds >= startsAt ? 'active' : 'pending';
            if (step.status !== nextStatus) {
                step.status = nextStatus;
                changed = true;
            }
        }

        if (changed) {
            this.saveBuildOrders();
            this.broadcastBuildOrderState();
        }
    }

    private evaluateBuildOrderFromGameData(message: string) {
        const active = this.getActiveBuildOrder();
        if (!active) {
            return;
        }

        let payload: any = message;
        try {
            payload = JSON.parse(message);
        } catch (e) {
        }

        let changed = false;
        for (const step of active.steps) {
            if (step.status === 'done' || this.lastGameTimeSeconds < step.atSeconds - step.toleranceSeconds) {
                continue;
            }
            if (this.payloadContainsStepEvidence(payload, step)) {
                step.status = 'done';
                step.completedAtSeconds = this.lastGameTimeSeconds;
                changed = true;
            }
        }

        if (changed) {
            this.saveBuildOrders();
            this.broadcastBuildOrderState();
        }
    }

    private payloadContainsStepEvidence(payload: any, step: IBuildOrderStep) {
        const target = (step.target || '').trim().toLowerCase();
        if (!target) {
            return false;
        }
        const blob = JSON.stringify(payload).toLowerCase();
        const targetTokens = target.split(/[\s,_-]+/).filter(t => t.length > 1);
        const actionTokens = new Map<BuildOrderAction, Array<string>>()
            .set('train', ['train', 'trained', 'queue', 'unit', 'worker'])
            .set('build', ['build', 'built', 'construct', 'construction', 'building'])
            .set('upgrade', ['upgrade', 'research', 'researched'])
            .set('custom', []);

        const targetFound = targetTokens.length === 0 ? blob.indexOf(target) >= 0 : targetTokens.every(t => blob.indexOf(t) >= 0);
        const actionCandidates = actionTokens.get(step.action) || [];
        const actionFound = step.action === 'custom' || actionCandidates.some(token => blob.indexOf(token) >= 0);
        return targetFound && actionFound;
    }

    private autoSelectBuildOrderForCurrentMatch() {
        if (!this.buildOrderAutoSelectEnabled || !this.currentMatch) {
            return;
        }

        const flattenedTeams = this.currentMatch.teams.map(team => team.members.map(member => ({ teamId: team.id, member })));
        const members = ([] as Array<{ teamId: number, member: ITeamMember }>).concat.apply([], flattenedTeams);
        const player = members.find(entry => entry.member.name === this.user?.displayName) || members.find(entry => !entry.member.isAI);
        const opponent = members.find(entry => player && entry.teamId !== player.teamId && !entry.member.isAI);
        const playerRace = this.normalizeBuildOrderRace(player?.member.race || 'any');
        const opponentRace = this.normalizeBuildOrderRace(opponent?.member.race || 'any');
        const matchup = this.normalizeBuildOrderMatchup(playerRace + 'v' + opponentRace);
        const order = this.buildOrders.find(o => o.autoSelect && (o.race === 'any' || this.normalizeBuildOrderRace(o.race) === playerRace) && (o.matchup === 'any' || this.normalizeBuildOrderMatchup(o.matchup) === matchup));
        if (order) {
            this.selectedBuildOrderId = order.id;
            this.activateSelectedBuildOrder();
        }
    }

    private normalizeBuildOrderRace(race: string) {
        const normalized = (race || 'any').toLowerCase().replace(/[_-]/g, ' ');
        if (normalized.indexOf('human') >= 0 || normalized === ERace.HUMAN.toString()) {
            return 'human';
        }
        if (normalized.indexOf('orc') >= 0 || normalized === ERace.ORC.toString()) {
            return 'orc';
        }
        if (normalized.indexOf('undead') >= 0 || normalized === ERace.UNDEAD.toString()) {
            return 'undead';
        }
        if (normalized.indexOf('night') >= 0 || normalized === ERace.NIGHT_ELF.toString()) {
            return 'night elf';
        }
        if (normalized.indexOf('random') >= 0 || normalized === ERace.RANDOM.toString()) {
            return 'random';
        }
        return 'any';
    }

    private normalizeBuildOrderMatchup(matchup: string) {
        return (matchup || 'any').toLowerCase().replace(/\s+/g, '').replace('nightelf', 'night elf');
    }

    private broadcastBuildOrderState() {
        const active = this.getActiveBuildOrder();
        const update = [{
            stateType: this.BUILD_ORDER_STATE_TYPE,
            isSnapshot: true,
            time: new Date(),
            snapshot: {
                enabled: !!active,
                gameTime: this.lastGameTimeSeconds,
                order: active ? {
                    id: active.id,
                    name: active.name,
                    race: active.race,
                    matchup: active.matchup,
                    completion: this.getBuildOrderCompletion(active),
                    steps: active.steps
                } : null
            }
        }];
        this.localBuildOrderState = JSON.stringify(update);
        if (this.localWSS) {
            this.localWSS.clients.forEach(c => c.send(this.localBuildOrderState));
        }
    }

    private sendEventToBroadcasters(eventType: EEventsystemConfigRuleTriggerType, data?: any) {
        for (const service of this.broadcastingServices) {
            service.handleGameEvent(eventType, data);
        }
    }

    private initLocalServer(): Promise<void> {
        this.localServerUrls = [];
        return new Promise((resolve, reject) => {
            const server = this.node.http.createServer();
            this.localWSS = new this.node.WebSocket.Server({ server });
            this.localWSS.on('connection', (ws) => {
                for (const msg of this.localUpdates) {
                    ws.send(msg);
                }
                if (this.localBuildOrderState) {
                    ws.send(this.localBuildOrderState);
                }
            });
            server.listen(0, () => {
                const { port } = server.address() as AddressInfo;
                this.localServerUrls.push('ws://127.0.0.1:' + port);
                const interfaces = this.node.os.networkInterfaces();
                Object.keys(interfaces).forEach((ifname) => {
                    interfaces[ifname].forEach((iface) => {
                        if ('IPv4' !== iface.family || iface.internal !== false) {
                            return;
                        }
                        this.localServerUrls.push('ws://' + iface.address + ':' + port);
                    });
                });
                resolve();
            });
        });
    }

    private addClientLog(log) {
        this.zone.run(() => {
            console.warn(log)
            this.recorderLog += "[" + new Date().toLocaleString('en-GB', { hour12: false }).split(' ')[1] + "] [CLIENT] " + log + "\n";
        });
    }


    /*********** WC3 Integration ****************/

    private initW3Integration(): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                const server = this.node.http.createServer();
                this.w3IntegrationServer = new this.node.WebSocket.Server({ server });
                this.w3IntegrationServer.on('connection', (ws) => {
                    for (const msg of this.localUpdates) {
                        ws.send(msg);
                    }
                });

                this.w3IntegrationServer.on('connection', (socket, req) => {
                    const gateway = JSON.parse(decodeURI(req.url.split('?')[1])).gateway;
                    this.addClientLog("WC3 integrator seen on GW " + gateway);
                    socket.on("message", (data) => {
                        const msg = JSON.parse(data.toString())
                        if (msg.messageType == 'MMStats' && this.requestW3PlayerStatsQueue.length > 0) {
                            const battleTag = this.requestW3PlayerStatsQueue.splice(0, 1)[0];
                            console.log("stats forwarded for: " + battleTag);
                            Parse.Cloud.run('reportBnetStats', { data: msg.payload.message, battleTag: battleTag });
                        }
                    })
                    this.requestW3PlayerStats("Pad#22587");
                    this.requestW3PlayerStats("Sonik#21222");
                })

                server.listen(25111, () => {
                    this.addClientLog("Waiting for WC3 integrator");
                    resolve();
                });
            } catch (e) {
                this.addClientLog("WC3 integrator faced an issue");
            }
        });
    }

    private requestW3PlayerStatsQueue = [];
    private requestW3PlayerStats(battleTag: string) {
        battleTag = battleTag.toLowerCase();
        if (this.requestW3PlayerStatsQueue.indexOf(battleTag) < 0) {
            this.requestW3PlayerStatsQueue.push(battleTag);

            console.log("stats requested for: " + battleTag)
            this.w3IntegrationServer?.clients.forEach(c => {
                c.send('{"type":"webui","message":"GetMatchmakingStats","payload":{"battleTag":"' + battleTag + '"}}');
            })
        }
    }
}
/*





function handleMessage(data, server) {
 

};

setTimeout(() => {

  //webSocket.send('{"type":"webui","message":"GetProfile","payload":{"battleTag":"NoGoN#1256"}}');
  webSocket.send('{"type":"webui","message":"GetProfile","payload":{"battleTag":"Grubby#1278"}}');
  //webSocket.send('{"type":"webui","message":"GetProfile","payload":{"battleTag":"Kraken#23522"}}');
  //webSocket.send('{"type":"webui","message":"ScreenTransitionInfo","payload":{"screen":"COLLECTION","type":"Screen","time":"' + new Date().getTime() +'"}}');
  //webSocket.send('{"type":"webui","message":"GetProfile","payload":{"battleTag":"Pad#22587"}}');
  console.log("SENT");
}, 5000)

*/

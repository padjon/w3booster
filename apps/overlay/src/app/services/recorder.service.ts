
import { isDevMode } from './devmode';
import ReconnectingWebSocket from 'reconnecting-websocket';
import { AppComponent } from 'app/app.component';
import { HttpClient } from '@angular/common/http';
import { IStateWrapper, IStateUpdate, EGameStateEnum, ISettingsState, User, EStateKeys, IPlayerStats, IMainAccount, IPlayer } from 'app/data/models';
import { environment } from 'environments/environment';

import { applyChange } from 'deep-diff';
import { AbstractStateManagerService } from '@app/data/services';

export class RecorderService extends AbstractStateManagerService {
  private url = window.location.hostname;
  private recorderServerUrl = (environment as any).RECORDER_SERVER_URL || 'wss://' + this.url + ':' + ((this.url.indexOf('localhost') >= 0) ? '25081' : '14970');
  private recorderChannel = null;
  private recorderSecret = null;

  private app: AppComponent = null;
  private lastWorkingUrl: string = null;
  private isNewGame = true;
  private localWSS: ReconnectingWebSocket = undefined;

  private initcb: (state: IStateWrapper) => void = null;
  private updatecb: (stateUpdate: IStateUpdate) => void = null;
  constructor(component: AppComponent, private http: HttpClient) {
    super();
    const url = new URL(window.location.href);
    this.recorderChannel = url.searchParams.get('channel');
    this.recorderSecret = url.searchParams.get('secret');
    this.app = component;
  }

  connect(): Promise<void> {
    return new Promise<void>((resolve, rej) => {
      if (!this.recorderChannel || !this.recorderSecret) {
        rej('channel or secret not provided in url!');
      } else {
        let firstMessage = true;
        const wss = new ReconnectingWebSocket(this.recorderServerUrl + '?channel=' + this.recorderChannel + '&secret=' + this.recorderSecret);
        wss.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (firstMessage) {
            firstMessage = false;

            if (data.error) {
              rej(data.error);
            } else {
              resolve();
              this.initcb(data);

              // if (this.app.isObserverOrReplay()) {
              this.proceedInit(data);
              // }
            }
          } else if (!data.error) {
            if (data.admin) {
              if (data.admin === 'forceReloadFrontend') {
                window.location.reload();
              }
            } else {
              this.updatecb(data);
              // if (this.app.isObserverOrReplay()) {
              this.proceedUpdate(data);
              // }
            }
          }
        };

        wss.onclose = () => {
          firstMessage = true;
        };
      }
    });
  }

  public onStateInit(callback: (state: IStateWrapper) => void) {
    this.initcb = callback;
  }

  public onStateUpdate(callback: (stateUpdate: IStateUpdate) => void) {
    this.updatecb = callback;
  }

  public onGameStateChanged(currentState: EGameStateEnum, lastState: EGameStateEnum) {
    if (currentState === EGameStateEnum.NO_GAME) {
      if (this.localWSS) {
        this.localWSS.close();
        this.localWSS = undefined;
      }
    } else if (lastState === EGameStateEnum.NO_GAME) {
      if (this.app.state.serviceState.misc && this.app.state.serviceState.misc.localServerUrls && this.app.state.serviceState.misc.localServerUrls.length > 0) {
        this.initByState(JSON.parse(JSON.stringify(this.app.state.serviceState)));

        let urlIndex = 0;
        const urlProvider = () => this.app.state.serviceState.misc.localServerUrls[urlIndex++ % this.app.state.serviceState.misc.localServerUrls.length];
        this.localWSS = new ReconnectingWebSocket(urlProvider);
        this.localWSS.onmessage = (event) => {
          const updates = JSON.parse(event.data);
          for (const update of updates) {
            this.updateStateByUpdate(update);
          }
        };
      }
    }
  }

  private proceedUpdate(update: IStateUpdate): boolean {
    const lastState = (this.getState() && this.getState().game) ? this.getState().game.state : EGameStateEnum.NO_GAME;
    if (update.isSnapshot) {
      this.getState()[update.stateType] = update.snapshot as any;
    } else {
      for (const difference of update.differences) {
        applyChange(this.getState()[update.stateType], null, difference);
      }
    }
    const newState = (this.getState() && this.getState().game) ? this.getState().game.state : EGameStateEnum.NO_GAME;
    if (lastState !== newState) {
      this.onGameStateChanged(newState, lastState);
    }
    return true;
  }

  private proceedInit(state: IStateWrapper) {
    const lastState = (this.getState() && this.getState().game) ? this.getState().game.state : EGameStateEnum.NO_GAME;
    this.initByState(JSON.parse(JSON.stringify(state)));
    const newState = (this.getState() && this.getState().game) ? this.getState().game.state : EGameStateEnum.NO_GAME;
    if (lastState !== newState) {
      this.onGameStateChanged(newState, lastState);
    }
  }

  public getSettings(): Promise<ISettingsState> { return Promise.resolve(null); }
  public getParseUser(): User { return null; }
  public getPlayerStats(player: IPlayer, realm: string): Promise<IPlayerStats> { return Promise.resolve(null); }
  public getPlayerMainAccount(player: IPlayer, realm: string): Promise<IMainAccount> { return Promise.resolve(null); }
  public onGameCreationStarted(rawGameData: any) { }
  public onGameCreationFinished(state: IStateWrapper) { }

  public sendStateDiff(key: EStateKeys, differences: Array<any>) {
    const update = { stateType: key, differences, time: new Date(), isSnapshot: false } as IStateUpdate;
    this.updatecb(update);
  }
  public sendStateSnapshot(key: EStateKeys) {
    const update = { stateType: key, snapshot: this.getState()[key], time: new Date(), isSnapshot: true } as IStateUpdate;
    this.updatecb(update);

  }
  public sendAllStateSnapshots() {
    for (const key of Object.keys(EStateKeys)) {
      this.sendStateSnapshot(EStateKeys[key]);
    }
  }
}

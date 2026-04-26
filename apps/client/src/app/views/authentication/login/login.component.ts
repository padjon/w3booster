import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import { NodeService, Parse } from '@app/data/services';
import { HttpClient } from '@angular/common/http';
import { AuthenticationService } from '../../../data/app/services/authentication.service';
import { environment } from '@env/environment';
import { jwtDecode } from "jwt-decode";
import { UserService } from '@app/data/modelservices';


enum ELoginState {
    LOGGING_IN,
    LOGGED_IN,
    LOGIN_REQUIRED,
    WAITING_FOR_CONFIRMATION,
    LOGIN_DISABLED
}

type LoginProvider = 'twitch' | 'battlenet';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
    public state = ELoginState.LOGIN_REQUIRED;
    public ELoginState = ELoginState;
    public oauthRedirectTo = '';
    public oauthClientId = '';
    public runningAuthStateID = '';
    public activeProvider: LoginProvider = 'twitch';
    public loginError = '';
    public isBrowserLogin = false;
    public connectProvider: LoginProvider = null;
    private currentCheckIndex = 0;
    private checkCount = 0

    constructor(public router: Router, public activatedRoute: ActivatedRoute, public http: HttpClient, public authenticationService: AuthenticationService, public nodeService: NodeService, public userService: UserService) {
    }

    public ngOnInit() {
        this.isBrowserLogin = !this.nodeService.isAvailable();
        const requestedConnectProvider = this.activatedRoute.snapshot.queryParamMap.get('connect') as LoginProvider;
        this.connectProvider = requestedConnectProvider === 'twitch' || requestedConnectProvider === 'battlenet'
            ? requestedConnectProvider
            : (localStorage.getItem('W3B_CONNECT_PROVIDER') as LoginProvider);
        if (this.connectProvider) {
            localStorage.setItem('W3B_CONNECT_PROVIDER', this.connectProvider);
        }
        this.runState();
    }

    private async runState() {
        this.loginError = '';
        const returnedAuthState = this.activatedRoute.snapshot.queryParamMap.get('twitchAuthState');
        if (returnedAuthState) {
            await this.handleBrowserAuthReturn('twitch', returnedAuthState);
            return;
        }

        const returnedBattleNetAuthState = this.activatedRoute.snapshot.queryParamMap.get('battlenetAuthState');
        if (returnedBattleNetAuthState) {
            await this.handleBrowserAuthReturn('battlenet', returnedBattleNetAuthState);
            return;
        }

        await this.continueLoginState();
    }

    private async continueLoginState() {
        const session = this.getStoredAuthSession();
        this.runningAuthStateID = localStorage.getItem('TWITCH_STATE');
        if(!this.runningAuthStateID) {
            this.runningAuthStateID = this.createAuthId();
            localStorage.setItem('TWITCH_STATE', this.runningAuthStateID);
        }

        
        if (!session) {
            this.state = ELoginState.LOGIN_REQUIRED;
            this.oauthRedirectTo = environment.REST_URL + "twitch-auth/register"
            this.oauthClientId = (this.oauthRedirectTo.indexOf('localhost') >= 0) ? 'p3optsh4af4qzs28v0xce54faocoqt' : 'sw2dpxriowzfaqcczg5d8ss3ymz1nu';
        } else {
            if (this.connectProvider && Parse.User.current()) {
                if (session.provider !== this.connectProvider) {
                    this.clearStoredAuthSession(session.provider);
                    await this.continueLoginState();
                    return;
                }

                this.state = ELoginState.LOGGING_IN;
                try {
                    await this.userService.connectExternalAccount(session.provider, session.id, session.accessToken);
                    localStorage.removeItem('W3B_CONNECT_PROVIDER');
                    this.connectProvider = null;
                    this.state = ELoginState.LOGGED_IN;
                    this.router.navigateByUrl('/dashboard/account');
                    return;
                } catch (e) {
                    this.clearStoredAuthSession(session.provider);
                    this.state = ELoginState.LOGIN_REQUIRED;
                    this.loginError = this.getProviderLabel(session.provider) + ' could not be connected. It may already belong to another W3Booster account.';
                    return;
                }
            }

            if (!Parse.User.current()) {
                this.state = ELoginState.LOGGING_IN;
                try {
                    const parseUser: Parse.User = await (new Parse.User() as any)._linkWith(session.provider, { authData: { 'id': session.id, access_token: session.accessToken } });
                    await Parse.User.become(parseUser.getSessionToken());
                    let user = await this.userService.getCurrentUser();
                    while (!user.broadcasterSecret) {
                        await this.wait(500)
                        user = await this.userService.getCurrentUser();
                    }
                } catch (e) {
                    this.authenticationService.logout();
                    await this.runState();
                    return;
                }
            }
            this.state = ELoginState.LOGGED_IN;
            this.router.navigateByUrl('/dashboard');
        }
    }

    public openTwitchLoginInExternalBrowser() {
        this.openLoginInExternalBrowser('twitch');
    }

    public openBattleNetLoginInExternalBrowser() {
        this.openLoginInExternalBrowser('battlenet');
    }

    private openLoginInExternalBrowser(provider: LoginProvider) {
        this.activeProvider = provider;
        if (this.connectProvider && this.connectProvider !== provider) {
            this.connectProvider = provider;
            localStorage.setItem('W3B_CONNECT_PROVIDER', provider);
        }
        if (!this.canStartTwitchLogin()) {
            return;
        }

        this.runningAuthStateID = this.nodeService.isAvailable() ? this.createAuthId() : this.createBrowserAuthState();
        localStorage.setItem('TWITCH_STATE', this.runningAuthStateID);

        const loginUrl = provider === 'twitch'
            ? "https://id.twitch.tv/oauth2/authorize?client_id=" + encodeURIComponent(this.oauthClientId) +
                "&redirect_uri=" + encodeURIComponent(this.oauthRedirectTo) +
                "&response_type=code&scope=" + encodeURIComponent("openid user:read:broadcast user:read:email") +
                "&force_verify=true&state=" + encodeURIComponent(this.runningAuthStateID)
            : environment.REST_URL + 'battlenet-auth/start?state=' + encodeURIComponent(this.runningAuthStateID);
        if (this.nodeService.isAvailable()) {
            this.nodeService.remote.shell.openExternal(loginUrl);
            this.state = ELoginState.WAITING_FOR_CONFIRMATION;
            this.checkCount = 0;
            this.checkForResult(++this.currentCheckIndex);
        } else {
            window.location.assign(loginUrl);
        }
    }

    public canStartTwitchLogin() {
        return Boolean(this.oauthClientId && this.oauthRedirectTo);
    }

    private wait(timeInMS: number) {
        return new Promise<void>((res) => {
            setTimeout(() => {
                res();
            }, timeInMS)
        }) 
    }

    private CHECK_INTERVAL = 5000;
    private MAX_CHECK_COUNT = (15 * 60 * 1000) / this.CHECK_INTERVAL
    private async checkForResult(index: number) {
        try {
            this.checkCount++;
            await this.completeLoginFromState(this.activeProvider, this.runningAuthStateID);
        } catch (e) {
            if(this.currentCheckIndex == index && this.checkCount < this.MAX_CHECK_COUNT) {
                setTimeout(this.checkForResult.bind(this, index), 5000)
            }
        }
    }

    private async handleBrowserAuthReturn(provider: LoginProvider, authState: string) {
        const authResult = this.activatedRoute.snapshot.queryParamMap.get(provider === 'twitch' ? 'twitchAuth' : 'battlenetAuth');
        if (authResult === 'error') {
            this.state = ELoginState.LOGIN_REQUIRED;
            this.loginError = this.activatedRoute.snapshot.queryParamMap.get('message') || this.getProviderLabel(provider) + ' login failed. Please try again.';
            return;
        }

        this.state = ELoginState.LOGGING_IN;
        this.runningAuthStateID = authState;
        localStorage.setItem('TWITCH_STATE', authState);
        try {
            await this.completeLoginFromState(provider, authState, true);
        } catch (e) {
            this.state = ELoginState.LOGIN_REQUIRED;
            this.loginError = this.getProviderLabel(provider) + ' login finished, but W3Booster could not complete the session. Please try again.';
        }
    }

    private async completeLoginFromState(provider: LoginProvider, authState: string, clearCallbackUrl = false) {
        const result = await this.http.get(environment.REST_URL + this.getAuthStatePath(provider) + encodeURIComponent(authState)).toPromise() as any;
        if (provider === 'twitch') {
            localStorage.setItem('TWITCH_ACCESS_TOKEN', result.access_token);
            localStorage.setItem('TWITCH_ID', (jwtDecode(result.id_token) as any).sub);
            localStorage.removeItem('BATTLENET_ACCESS_TOKEN');
            localStorage.removeItem('BATTLENET_ID');
        } else {
            localStorage.setItem('BATTLENET_ACCESS_TOKEN', result.access_token);
            localStorage.setItem('BATTLENET_ID', result.id);
            localStorage.removeItem('TWITCH_ACCESS_TOKEN');
            localStorage.removeItem('TWITCH_ID');
        }
        if (clearCallbackUrl) {
            await this.router.navigate(['/login'], { replaceUrl: true });
        }
        await this.continueLoginState();
    }

    private createAuthId() {
        if (typeof crypto !== 'undefined' && crypto['randomUUID']) {
            return crypto['randomUUID']();
        }

        return Date.now() + '-' + Math.random().toString(36).substring(2);
    }

    private createBrowserAuthState() {
        const payload = JSON.stringify({
            id: this.createAuthId(),
            mode: 'browser',
            returnTo: window.location.origin + '/login' + (this.connectProvider ? '?connect=' + this.connectProvider : '')
        });
        return 'w3b:' + btoa(payload).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }

    private getStoredAuthSession(): { provider: LoginProvider; id: string; accessToken: string } | null {
        const twitchAccessToken = localStorage.getItem('TWITCH_ACCESS_TOKEN');
        const twitchId = localStorage.getItem('TWITCH_ID');
        if (twitchAccessToken && twitchId) {
            return { provider: 'twitch', id: twitchId, accessToken: twitchAccessToken };
        }

        const battleNetAccessToken = localStorage.getItem('BATTLENET_ACCESS_TOKEN');
        const battleNetId = localStorage.getItem('BATTLENET_ID');
        if (battleNetAccessToken && battleNetId) {
            return { provider: 'battlenet', id: battleNetId, accessToken: battleNetAccessToken };
        }

        return null;
    }

    private clearStoredAuthSession(provider: LoginProvider) {
        if (provider === 'twitch') {
            localStorage.removeItem('TWITCH_ACCESS_TOKEN');
            localStorage.removeItem('TWITCH_ID');
        } else {
            localStorage.removeItem('BATTLENET_ACCESS_TOKEN');
            localStorage.removeItem('BATTLENET_ID');
        }
    }

    private getAuthStatePath(provider: LoginProvider) {
        return provider === 'twitch' ? 'twitch-auth/state/' : 'battlenet-auth/state/';
    }

    public getProviderLabel(provider: LoginProvider) {
        return provider === 'twitch' ? 'Twitch' : 'Battle.net';
    }
}

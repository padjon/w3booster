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
    public loginError = '';
    public isBrowserLogin = false;
    private currentCheckIndex = 0;
    private checkCount = 0

    constructor(public router: Router, public activatedRoute: ActivatedRoute, public http: HttpClient, public authenticationService: AuthenticationService, public nodeService: NodeService, public userService: UserService) {
    }

    public ngOnInit() {
        this.isBrowserLogin = !this.nodeService.isAvailable();
        this.runState();
    }

    private async runState() {
        this.loginError = '';
        const returnedAuthState = this.activatedRoute.snapshot.queryParamMap.get('twitchAuthState');
        if (returnedAuthState) {
            await this.handleBrowserAuthReturn(returnedAuthState);
            return;
        }

        await this.continueLoginState();
    }

    private async continueLoginState() {
        const accessToken = localStorage.getItem('TWITCH_ACCESS_TOKEN');
        const id = localStorage.getItem('TWITCH_ID');
        this.runningAuthStateID = localStorage.getItem('TWITCH_STATE');
        if(!this.runningAuthStateID) {
            this.runningAuthStateID = this.createAuthId();
            localStorage.setItem('TWITCH_STATE', this.runningAuthStateID);
        }

        
        if (!id || !accessToken) {
            this.state = ELoginState.LOGIN_REQUIRED;
            this.oauthRedirectTo = environment.REST_URL + "twitch-auth/register"
            this.oauthClientId = (this.oauthRedirectTo.indexOf('localhost') >= 0) ? 'p3optsh4af4qzs28v0xce54faocoqt' : 'sw2dpxriowzfaqcczg5d8ss3ymz1nu';
        } else {
            if (!Parse.User.current()) {
                this.state = ELoginState.LOGGING_IN;
                try {
                    const parseUser: Parse.User = await (new Parse.User() as any)._linkWith('twitch', { authData: { 'id': id, access_token: accessToken } });
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
        this.runningAuthStateID = this.nodeService.isAvailable() ? this.createAuthId() : this.createBrowserAuthState();
        localStorage.setItem('TWITCH_STATE', this.runningAuthStateID);

        const loginUrl = "https://id.twitch.tv/oauth2/authorize?client_id=" + encodeURIComponent(this.oauthClientId) +
            "&redirect_uri=" + encodeURIComponent(this.oauthRedirectTo) +
            "&response_type=code&scope=" + encodeURIComponent("openid user:read:broadcast user:read:email") +
            "&force_verify=true&state=" + encodeURIComponent(this.runningAuthStateID);
        if (this.nodeService.isAvailable()) {
            this.nodeService.remote.shell.openExternal(loginUrl);
            this.state = ELoginState.WAITING_FOR_CONFIRMATION;
            this.checkCount = 0;
            this.checkForResult(++this.currentCheckIndex);
        } else {
            window.location.assign(loginUrl);
        }
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
            await this.completeLoginFromState(this.runningAuthStateID);
        } catch (e) {
            if(this.currentCheckIndex == index && this.checkCount < this.MAX_CHECK_COUNT) {
                setTimeout(this.checkForResult.bind(this, index), 5000)
            }
        }
    }

    private async handleBrowserAuthReturn(authState: string) {
        const authResult = this.activatedRoute.snapshot.queryParamMap.get('twitchAuth');
        if (authResult === 'error') {
            this.state = ELoginState.LOGIN_REQUIRED;
            this.loginError = this.activatedRoute.snapshot.queryParamMap.get('message') || 'Twitch login failed. Please try again.';
            return;
        }

        this.state = ELoginState.LOGGING_IN;
        this.runningAuthStateID = authState;
        localStorage.setItem('TWITCH_STATE', authState);
        try {
            await this.completeLoginFromState(authState, true);
        } catch (e) {
            this.state = ELoginState.LOGIN_REQUIRED;
            this.loginError = 'Twitch login finished, but W3Booster could not complete the session. Please try again.';
        }
    }

    private async completeLoginFromState(authState: string, clearCallbackUrl = false) {
        const result = await this.http.get(environment.REST_URL + "twitch-auth/state/" + encodeURIComponent(authState)).toPromise() as any;
        localStorage.setItem('TWITCH_ACCESS_TOKEN', result.access_token);
        localStorage.setItem('TWITCH_ID', (jwtDecode(result.id_token) as any).sub);
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
            returnTo: window.location.origin + '/login'
        });
        return 'w3b:' + btoa(payload).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }
}

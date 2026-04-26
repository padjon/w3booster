import { Express } from 'express';
import { BaseAPI } from './base/base.api';
import { appConfig } from 'app/config';
import { Webclient } from 'app/data/services';

export class TwitchAuthAPI extends BaseAPI {

    private stateToAccessData = new Map();
    private browserStatePrefix = 'w3b:';

    constructor(app: Express) {
        super(app);

        this.getRouter().get('/register', async (req, res, next) => {
            const host = req.get('host').indexOf('localhost') >= 0 ? req.get('host') : req.get('host').split(':')[0];
            const redirectUrl = req.protocol + '://' + host + req.originalUrl.split('?')[0];
            const rawState = typeof req.query.state === 'string' ? req.query.state : '';
            const browserReturnTo = this.getBrowserReturnUrl(rawState);
            const body = new URLSearchParams({
                client_id: appConfig.TWITCH_CLIENT_ID,
                client_secret: appConfig.TWITCH_CLIENT_SECRET,
                code: typeof req.query.code === 'string' ? req.query.code : '',
                grant_type: 'authorization_code',
                redirect_uri: redirectUrl
            }).toString();
            try {
                const data = await Webclient.post('https://id.twitch.tv/oauth2/token', body)
                if (data && data.access_token && data.id_token) {
                    this.stateToAccessData.set(rawState, { access_token: data.access_token, id_token: data.id_token });
                    if (browserReturnTo) {
                        res.redirect(this.withAuthResult(browserReturnTo, rawState, 'success'));
                    } else {
                        res.send('Login successful. Return to the W3Booster App now. This window can get closed safely.');
                    }
                } else {
                    this.sendAuthError(res, browserReturnTo, rawState, data && data.message ? data.message : 'Unknown Twitch response');
                }
            } catch (e) {
                console.error('Error while authenticating with Twitch: ' + e);
                this.sendAuthError(res, browserReturnTo, rawState, e.message);
            }
        });

        this.getRouter().get('/state/:state', (req, res, next) => {
            const accessData = this.stateToAccessData.get(req.params.state);
            if (accessData) {
                this.stateToAccessData.delete(req.params.state);
                res.send(accessData);
            } else {
                res.sendStatus(404);
            }
        });
    }

    private sendAuthError(res, browserReturnTo: string, state: string, message: string) {
        if (browserReturnTo) {
            res.redirect(this.withAuthResult(browserReturnTo, state, 'error', message));
        } else {
            res.send('We were not able to authenticate you. Please try again.. (' + message + ')');
        }
    }

    private withAuthResult(returnTo: string, state: string, result: 'success' | 'error', message = '') {
        const url = new URL(returnTo);
        url.searchParams.set('twitchAuth', result);
        url.searchParams.set('twitchAuthState', state);
        if (message) {
            url.searchParams.set('message', message);
        }

        return url.toString();
    }

    private getBrowserReturnUrl(state: string): string {
        if (!state || state.indexOf(this.browserStatePrefix) !== 0) {
            return '';
        }

        try {
            const encoded = state.substring(this.browserStatePrefix.length).replace(/-/g, '+').replace(/_/g, '/');
            const payload = JSON.parse(Buffer.from(encoded, 'base64').toString('utf8'));
            if (payload && payload.mode === 'browser' && this.isAllowedReturnUrl(payload.returnTo)) {
                return payload.returnTo;
            }
        } catch (e) {
            console.error('Invalid Twitch browser auth state: ' + e);
        }

        return '';
    }

    private isAllowedReturnUrl(returnTo: string): boolean {
        try {
            const url = new URL(returnTo);
            const host = url.hostname.toLowerCase();
            return (url.protocol === 'https:' || url.protocol === 'http:') &&
                (host === 'localhost' ||
                    host === '127.0.0.1' ||
                    host === 'w3booster.com' ||
                    host.endsWith('.w3booster.com'));
        } catch (e) {
            return false;
        }
    }
}

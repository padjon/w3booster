import { Express } from 'express';
import { BaseAPI } from './base/base.api';
import { appConfig } from 'app/config';
import { Webclient } from 'app/data/services';

interface BattleNetAccessData {
    access_token: string;
    id: string;
    battletag?: string;
}

export class BattleNetAuthAPI extends BaseAPI {
    private stateToAccessData = new Map<string, BattleNetAccessData>();
    private browserStatePrefix = 'w3b:';

    constructor(app: Express) {
        super(app);

        this.getRouter().get('/start', (req, res) => {
            if (!appConfig.BATTLENET_CLIENT_ID || !appConfig.BATTLENET_CLIENT_SECRET) {
                res.status(503).send('Battle.net login is not configured.');
                return;
            }

            const state = typeof req.query.state === 'string' ? req.query.state : '';
            if (!state) {
                res.status(400).send('Missing state parameter.');
                return;
            }

            const authorizeUrl = new URL(`https://${appConfig.BATTLENET_REGION}.battle.net/oauth/authorize`);
            authorizeUrl.searchParams.set('client_id', appConfig.BATTLENET_CLIENT_ID);
            authorizeUrl.searchParams.set('redirect_uri', this.getCallbackUrl(req));
            authorizeUrl.searchParams.set('response_type', 'code');
            authorizeUrl.searchParams.set('scope', 'openid');
            authorizeUrl.searchParams.set('state', state);
            res.redirect(authorizeUrl.toString());
        });

        this.getRouter().get('/register', async (req, res) => {
            const rawState = typeof req.query.state === 'string' ? req.query.state : '';
            const browserReturnTo = this.getBrowserReturnUrl(rawState);
            const body = new URLSearchParams({
                client_id: appConfig.BATTLENET_CLIENT_ID,
                client_secret: appConfig.BATTLENET_CLIENT_SECRET,
                code: typeof req.query.code === 'string' ? req.query.code : '',
                grant_type: 'authorization_code',
                redirect_uri: this.getCallbackUrl(req)
            }).toString();

            try {
                const tokenData = await Webclient.post(`https://${appConfig.BATTLENET_REGION}.battle.net/oauth/token`, body);
                if (!tokenData?.access_token) {
                    this.sendAuthError(res, browserReturnTo, rawState, tokenData?.error_description ?? 'Unknown Battle.net response');
                    return;
                }

                const profile = await this.getUserInfo(tokenData.access_token);
                const id = String(profile?.sub ?? profile?.id ?? '');
                if (!id) {
                    this.sendAuthError(res, browserReturnTo, rawState, 'Battle.net did not return an account id.');
                    return;
                }

                this.stateToAccessData.set(rawState, {
                    access_token: tokenData.access_token,
                    id,
                    battletag: profile?.battletag
                });

                if (browserReturnTo) {
                    res.redirect(this.withAuthResult(browserReturnTo, rawState, 'success'));
                } else {
                    res.send('Login successful. Return to the W3Booster App now. This window can get closed safely.');
                }
            } catch (e: any) {
                console.error('Error while authenticating with Battle.net: ' + e);
                this.sendAuthError(res, browserReturnTo, rawState, e?.message ?? String(e));
            }
        });

        this.getRouter().get('/state/:state', (req, res) => {
            const accessData = this.stateToAccessData.get(req.params.state);
            if (accessData) {
                this.stateToAccessData.delete(req.params.state);
                res.send(accessData);
            } else {
                res.sendStatus(404);
            }
        });
    }

    private async getUserInfo(accessToken: string) {
        const response = await fetch(`https://${appConfig.BATTLENET_REGION}.battle.net/oauth/userinfo`, {
            headers: {
                Authorization: 'Bearer ' + accessToken
            }
        });
        return response.json();
    }

    private getCallbackUrl(req) {
        const host = req.get('host').indexOf('localhost') >= 0 ? req.get('host') : req.get('host').split(':')[0];
        return req.protocol + '://' + host + req.originalUrl.split('?')[0].replace('/start', '/register');
    }

    private sendAuthError(res, browserReturnTo: string, state: string, message: string) {
        if (browserReturnTo) {
            res.redirect(this.withAuthResult(browserReturnTo, state, 'error', message));
        } else {
            res.send('We were not able to authenticate you. Please try again. (' + message + ')');
        }
    }

    private withAuthResult(returnTo: string, state: string, result: 'success' | 'error', message = '') {
        const url = new URL(returnTo);
        url.searchParams.set('battlenetAuth', result);
        url.searchParams.set('battlenetAuthState', state);
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
            console.error('Invalid Battle.net browser auth state: ' + e);
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

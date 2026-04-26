import { Express } from 'express';
import { BaseAPI } from './base/base.api';
import { appConfig } from 'app/config';
import { Webclient } from 'app/data/services';

export class TwitchAuthAPI extends BaseAPI {

    private stateToAccessData = new Map();

    constructor(app: Express) {
        super(app);

        this.getRouter().get('/register', async (req, res, next) => {
            const host = req.get('host').indexOf('localhost') >= 0 ? req.get('host') : req.get('host').split(':')[0];
            const redirectUrl = req.protocol + '://' + host + req.originalUrl.split('?')[0];
            const body = 'client_id=' + appConfig.TWITCH_CLIENT_ID + '&client_secret=' + appConfig.TWITCH_CLIENT_SECRET + '&code=' + req.query.code + '&grant_type=authorization_code&redirect_uri=' + redirectUrl;
            try {
                const data = await Webclient.post('https://id.twitch.tv/oauth2/token', body)    
                if (data && data.access_token && data.id_token) {
                    this.stateToAccessData.set(req.query.state, { access_token: data.access_token, id_token: data.id_token });
                    res.send('Login successful. Return to the W3Booster App now. This window can get closed safely.');
                } else {
                    res.send('We were not able to authenticate you. Please try again.. (' + data.message + ')');
                }
            } catch (e) {
                console.error('Error while authenticating with Twitch: ' + e);
                res.send('We were not able to authenticate you. Please try again.. (' + e.message + ')');
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
}
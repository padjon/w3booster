import { Express } from 'express';
import { BaseAPI } from './base/base.api';
import { PaypalCallback } from 'app/data/models';
import { appConfig } from 'app/config';
import { StateManager } from './w3stream/state-manager';

export class AdminAPI extends BaseAPI {

    constructor(app: Express) {
        super(app);

        this.getRouter().get('/forceUpdateOverlays', (req, res, next) => {
            console.log('Forcing overlay refresh of the following users:');
            for (const userStateManager of StateManager.getAll()) {
                console.log('Updating channel:' + userStateManager.getChannel());
                userStateManager.forceReloadFrontends();
            }
            res.send('OK');
        });

        this.getRouter().post('/paypal', (req, res, next) => {

            const callback = new PaypalCallback();
            callback.isSandbox = (appConfig.isDevMode );
            callback.value = req.body;
            console.log('PAYPAL INPUT!');
            console.log(req.body);
            callback.save();
            res.send('OK');
        });
    }
}

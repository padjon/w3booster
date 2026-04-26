import { Express } from 'express';
import { BaseAPI } from './base/base.api';
import { ServiceManager, W3AliasService } from 'app/data/services';
import { matchUpdate } from './parse/cloud/functions/matchupdate';
import { appConfig } from 'app/config';


export class W3AliasAPI extends BaseAPI {

    private w3AliasService = ServiceManager.get(W3AliasService);
    private bootTime = new Date().getTime();

    constructor(app: Express) {
        super(app);

        this.getRouter().get('/:realm', (req, res, next) => {
            const realm = req.params.realm;
            const userId = req.query.userid as string;
            if (realm && userId) {
                this.w3AliasService.getMainAccount(userId, realm).then((mainAccount) => {
                    res.send(mainAccount);
                });
            } else {
                res.sendStatus(404);
            }
        });

        this.getRouter().post('/matchUpdate/:userId', (req, res, next) => {
            console.log(new Date().getTime() - this.bootTime);
            if (new Date().getTime() - this.bootTime < 60000) {
                console.log('SKIP ON STARTUP');
                if (!appConfig.isDevMode ) {
                    res.send(200);
                    return;
                }
            }
            matchUpdate(req.params.userId, req.body.type, req.body.data);
            res.send(200);
        });

        this.getRouter().post('/logUpdate/:userId', (req, res, next) => {
            console.log(req.body.data);
            res.send(200);
        });
    }
}

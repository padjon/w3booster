import { Express } from 'express';
import { BaseAPI } from './base/base.api';
import { ServiceManager, W3StatsService } from 'app/data/services';

export class W3StatsAPI extends BaseAPI {

    private w3StatsService = ServiceManager.get(W3StatsService);

    constructor(app: Express) {
        super(app);

        this.getRouter().get('/:realm/:race', (req, res, next) => {
            const realm = req.params.realm;
            const race = Number(req.params.race);
            const userId = req.query.userid as string;
            if (realm && userId) {
                this.w3StatsService.getStats(realm, userId, race).then((stats) => {
                    res.send(stats);
                });
            } else {
                res.sendStatus(404);
            }
        });
    }
}

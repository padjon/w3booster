import { Express } from 'express';
import { BaseAPI } from '../base/base.api';
import { wsManager } from './ws-manager';
import { clientWSManager } from './client-ws-manager';

export class W3StreamAPI extends BaseAPI {

    constructor(app: Express) {
        super(app);

        (app as any).on('OVERLAY_BROADCAST_SERVER_LISTENS', ((server, x) => {
            wsManager.init(server);
            clientWSManager.init(server);
        }) as any);
    }
}

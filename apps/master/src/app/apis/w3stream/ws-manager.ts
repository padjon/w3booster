import * as https from 'https';
import * as WebSocket from 'ws';
import * as  url from 'url';
import { StateManager } from './state-manager';


class WSManager {
    private wss: WebSocket.Server = null;

    constructor() { }

    public init(httpServer: https.Server) {
        this.wss = new WebSocket.Server({ noServer: true });
        this.wss.on('connection', async (ws, req) => {
            const query = url.parse(req.url, true).query;
            if (query.channel && query.secret) {
                const userStateManager = await StateManager.getByUserId(query.channel as string);
                if (!userStateManager || userStateManager.getChannelSecret() != query.secret) {
                    this.closeByError(ws, 'Channel and/or secret not correct');
                } else {
                    console.log('WS: Broadcaster connected. Channel: ' + query.channel);
                    (ws as any).channel = query.channel;
                    userStateManager.getStateHandlerForWS(ws);
                }
            } else if (!!query.debug) {
                (ws as any).debug = true;
            } else {
                this.closeByError(ws, 'Channel and/or secret missing');
            }
            ws.on('message', function (message) {
                console.log('received: %s', message);
            });

            ws.on('close', function () {
            });
            ws.on('error', function () {
            });
        });


        httpServer.on('upgrade', (request, socket, head) => {
            const pathname = url.parse(request.url).pathname;
            if (pathname !== '/client') {
                this.wss.handleUpgrade(request, socket, head, (ws) => {
                    this.wss.emit('connection', ws, request);
                });
            }
        });
    }

    public dbgBroadcast(data) {
        this.wss.clients.forEach(function each(client) {
            if (client.readyState === WebSocket.OPEN && (client as any).debug) {
                client.send(data);
            }
        });
    }

    public channelBroadcast(channel: string, data) {
        if (this.wss) {
            this.wss.clients.forEach(function each(client) {
                if (client.readyState === WebSocket.OPEN && (client as any).channel == channel) {
                    client.send(data);
                }
            });
        }
    }

    public closeByError(client: any, error: string) {
        console.log('ERROR:' + error);
        client.send(JSON.stringify({ error: error }));
        client.close();
    }
}

export const wsManager = new WSManager();
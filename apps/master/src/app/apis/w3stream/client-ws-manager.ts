import * as https from 'https';
import * as WebSocket from 'ws';
import * as  url from 'url';
import { matchUpdate } from '../parse/cloud/functions/matchupdate';

class ClientWSManager {
    private wss: WebSocket.Server = null;

    constructor() { }

    public init(httpServer: https.Server) {
        this.wss = new WebSocket.Server({ noServer: true });

        this.wss.on('connection', async (ws, req) => {
            const query = url.parse(req.url, true).query;
            if (query.userId) {

                const userId = query.userId;
                console.log('MatchUpdate user connected: ' + userId);

                ws.on('message', function (message) {
                    const data = JSON.parse(message.toString());
                    matchUpdate(userId, data.type, data.data);
                });

                ws.on('close', function () {
                });
                ws.on('error', function () {
                });

            } else {
                this.closeByError(ws, 'userId missing');
            }
        });

        httpServer.on('upgrade', (request, socket, head) => {
            const pathname = url.parse(request.url).pathname;
            if (pathname === '/client') {
                this.wss.handleUpgrade(request, socket, head, (ws) => {
                    this.wss.emit('connection', ws, request);
                });
            }
        });
    }

    public closeByError(client: any, error: string) {
        console.log('ERROR:' + error);
        client.send(JSON.stringify({ error: error }));
        client.close();
    }
}

export const clientWSManager = new ClientWSManager();
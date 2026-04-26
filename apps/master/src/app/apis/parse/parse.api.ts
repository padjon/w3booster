import { Express } from 'express';
import { ParseServer } from 'parse-server';
import { AsyncInitBaseAPI } from '../base/base.api';
import { appConfig } from 'app/config';
import { TwitchAuthAdapter } from './cloud/twitch-auth-adapter';
import * as path from 'path'

export class ParseAPI extends AsyncInitBaseAPI {

    constructor(app: Express) {
        super(app);

        (app as any).on('HTTP_SERVER_LISTENS', (server) => {
            ParseServer.createLiveQueryServer(server);
            console.log('Parse LiveQuery Server started');
        });
    }

    protected async createHandler() {
        return (await new ParseServer({
            allowClientClassCreation: true,
            encodeParseObjectInCloudFunction: true,
            databaseURI: appConfig.MONGOLAB_URI,
            cloud: __dirname + '/cloud/cloud' + path.extname(__filename),
            appId: appConfig.PARSE.APP_ID,
            masterKey: appConfig.PARSE.MASTERKEY, // Add your master key here. Keep it secret!
            // Allow master key usage from all IPs (both IPv4 and IPv6)
            masterKeyIps: ['0.0.0.0/0', '::/0'],
            serverURL: appConfig.PARSE.URL,  // Don't forget to change to https if needed
            javascriptKey: appConfig.PARSE.JS_KEY,
            verbose: appConfig.PARSE.VERBOSE_MODE,
            logLevel: 'error',
            liveQuery: {
                classNames: ['_User'] // List of classes to support for query subscriptions
            },
            publicServerURL: appConfig.PARSE.URL,
            appName: 'W3Booster',
            auth: {
                twitch: {
                    class: TwitchAuthAdapter
                }
            }
        }).start()).app;
    }
}

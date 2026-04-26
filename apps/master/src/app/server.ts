import moduleAlias = require('module-alias');
moduleAlias.addAlias('app', __dirname);
moduleAlias.addAlias('@angular/core', __dirname + '/data/common-compatibility/@angular.core');

import { W3StatsService, EStatsRace } from './data/app/services/w3stats.service';
// require('app-module-path').addPath(__dirname + '/..');
import * as https from 'https';
import * as http from 'http';
import * as fs from 'fs';
import express from 'express';
import app from './app';
import { Match } from './data/common/models/match';
import { ServiceManager, PaypalService, W3AliasService } from './data/services';
import { MatchService, ShopOrderService, UserService } from './data/modelservices';
import { MatchParticipant, EUserPlan, EUserSettingEnum, ERace } from './data/models';
import { MailService } from './data/app/services/mail.service';
import schedule = require('node-schedule');
import { appConfig } from './config';


process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Optionally log or alert here
});

/**
 * Start servers
 */

let serverModule = https;
let serverOptions = {
    key: fs.readFileSync(appConfig.HTTPS_KEY_PATH, 'utf8'),
    cert: fs.readFileSync(appConfig.HTTPS_CERT_PATH, 'utf8')
} as https.ServerOptions;

const parseServer = serverModule.createServer(serverOptions, app);
parseServer.listen(appConfig.PORT, () => {
    console.log('PARSE REST-Server running on port ' + appConfig.PORT + '.');
    (app as any).emit('HTTP_SERVER_LISTENS', parseServer);

    const userService = ServiceManager.get(UserService);

    if (!appConfig.isDevMode) {
        console.log('Scheduling Plan-Cleanup');
        schedule.scheduleJob('30 */3 * * *', () => {
            console.log('Running plan-cleanup...');
            userService.getByAttribute('plan', 1).then((userList) => {
                for (const user of userList) {
                    if (user.planUntil < new Date()) {
                        console.log('plan ended for ' + user.displayName);
                        user.plan = EUserPlan.BASIC;
                        user.save();
                    }
                }
            });
        });
    }
});

(app as any).on('PARSE_SERVER_READY' , () => {
    let overlayServerOptions = {
        key: fs.readFileSync(appConfig.OVERLAY_HTTPS_KEY_PATH, 'utf8'),
        cert: fs.readFileSync(appConfig.OVERLAY_HTTPS_CERT_PATH, 'utf8')
    } as https.ServerOptions;

    const overlayBroadcastServer = serverModule.createServer(overlayServerOptions, express());
    overlayBroadcastServer.listen(appConfig.OVERLAY_BROADCAST_PORT, () => {
        console.log('OverlayBroadcastServer running on port ' + appConfig.OVERLAY_BROADCAST_PORT + '.');
        (app as any).emit('OVERLAY_BROADCAST_SERVER_LISTENS', overlayBroadcastServer);
    });
})



// grubby#1278
/*
ServiceManager.get(W3StatsService).getStats('W3Champions', 'Pad#22587', ERace.HUMAN).then((result) => {
    console.log(result);
});
*/

/*
ServiceManager.get(W3StatsService).getStats('Reforged', 'pad#22587', ERace.HUMAN).then((result) => {
    console.log(result);
});
*/

/*
const mailService = ServiceManager.get(MailService);
mailService.sendMail('PAYMENT WAS BOOKED! x => y', 'PAYMENT FOR USER ASD WAS BOOKED');
*/

/*
const w3AliasService = ServiceManager.get(W3AliasService);
w3AliasService.getMainAccount('AntiMonitor#21414', 'Reforged').then(u => {
    console.log(u);
});
*/

/*
const userService = ServiceManager.get(UserService);
userService.get(['overlaySettings'], 999999).then(users => {
    for (const user of users) {
        // console.log(user.getSetting(EUserSettingEnum.UPDATE_MATCH_SCORE_AUTOMATICALLY, true));
        if (user.overlaySettings) {
            user.overlaySettings.ingameOverlayWhilePlayingEnabled = user.getSetting(EUserSettingEnum.UPDATE_MATCH_SCORE_AUTOMATICALLY, true);
            user.overlaySettings.save();
        }
    }
});
*/

//
/*
ServiceManager.get(W3StatsService).getStats('Northrend', 'qweqwe').then((result) => {
    console.log(result);
});
*/


/*ServiceManager.get(ShopOrderService).CreateOrder('BHNy4cogfY').then((url) => {
    console.log('URL:');
    console.log(url);
});
*/

// require('../tools/data-exporter');

/*
const matchService = ServiceManager.get(MatchService);

matchService.getById('7FvGrxQcg0').then((match) => {
    const participant = new MatchParticipant();
    participant.name = 'asd';
    console.log(match.teams.get(1));
    console.log(match.teams.get(1).push(participant));
    match.save();
});
*/
/*
const match = new Match();
match.teams.set(1, []);
match.teams.set(2, []);
match.save();
*/

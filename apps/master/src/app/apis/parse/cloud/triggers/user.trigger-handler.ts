import { TriggerHandler } from './base/trigger-handler';
import { UserService } from 'app/data/modelservices';
import { User, UserPlanHistory, EUserPlan } from 'app/data/models';
import * as https from 'https';
import { StateManager } from 'app/apis/w3stream/state-manager';
import { ServiceManager, MailService, DiscordService } from 'app/data/services';
import { appConfig } from 'app/config';

class UserTriggerHandler extends TriggerHandler<User, UserService> {

    constructor() {
        super(User, UserService);
    }

    protected async afterCreate(user: User) {
        return ((id, token) => {
            return ((path, token) => {
                return new Promise(function (resolve, reject) {
                    https.get({
                        hostname: 'api.twitch.tv',
                        path: '/helix/' + path,
                        headers: {
                            Authorization: 'Bearer ' + token,
                            'Client-ID': appConfig.TWITCH_CLIENT_ID
                        }
                    }, function (res) {
                        let data = '';
                        res.on('data', function (chunk) {
                            data += chunk;
                        });
                        res.on('end', function () {
                            try {
                                data = JSON.parse(data);
                            } catch (e) {
                                return reject(e);
                            }
                            resolve(data);
                        });
                    }).on('error', function () {
                        reject('Failed to validate this access token with Twitch.');
                    });
                });
            })('users', token).then((response: any) => {
                if (response && (response.data) && (response.data[0]) && response.data[0].id == id) {
                    return response.data[0];
                }
            });
        })(user.authData.twitch.id, user.authData.twitch.access_token).then(async (twitchDetails) => {
            const newUser = user.broadcasterSecret ? false : true;
            user.twitchUserData = twitchDetails;
            if(user.twitchUserData.email) {
                user.email = user.twitchUserData.email;
            } else {
                user.unsetTypeSave('email');
            }
            
            user.displayName = user.twitchUserData.display_name;
            if (newUser) {
                // apply defaults
                const userDefaults = new User();
                for (const key of Object.keys(userDefaults).filter(k => k.startsWith('_') && user[k] === undefined)) {
                    user[key] = userDefaults[key];
                }
                user.broadcasterSecret = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

            	await user.obsOverlaySettings.save();
            	await user.playerOverlaySettings.save();
            }

            await user.save();
            console.log((newUser) ? 'New user created:' : 'User updated by twitch data:');
            console.log(user);
        });
    }

    protected async afterUpdate?(user: User, previousUser: User) {
       (await StateManager.getByUser(user)).onSettingsChanged();

        // if the user was just created with default values (prevousUser = without defaults)
        if (previousUser.plan == undefined) {
            return;
        }

        const nextUntil = user.planUntil ? user.planUntil.getTime() : 0;
        const prevUntil = previousUser.planUntil ? previousUser.planUntil.getTime() : 0;
        if (Number(user.plan) != Number(previousUser.plan) || nextUntil != prevUntil) {
            const userPlanHistoryEntry = new UserPlanHistory();
            userPlanHistoryEntry.user = user;
            userPlanHistoryEntry.oldPlan = previousUser.plan;
            userPlanHistoryEntry.oldPlanUntil = previousUser.planUntil;
            userPlanHistoryEntry.newPlan = user.plan;
            userPlanHistoryEntry.newPlanUntil = user.planUntil;
            userPlanHistoryEntry.save();

            if (user.plan == EUserPlan.PRO) {
                const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
                const firstDate = (previousUser.planUntil && previousUser.planUntil.getTime() > new Date().getTime()) ? previousUser.planUntil : new Date();
                const secondDate = user.planUntil;
                const diffDays = Math.round(Math.abs((firstDate.getTime() - secondDate.getTime()) / oneDay));
                if (user.discordUserData) {
                    ServiceManager.get(DiscordService).addProRole(user.discordUserData);
                }
                ServiceManager.get(MailService).sendMail('W3B Plan: ' + user.displayName + ' (+' + diffDays + 'd)', '');
            } else {
                if (user.discordUserData) {
                    ServiceManager.get(DiscordService).removeProRole(user.discordUserData);
                }
                ServiceManager.get(MailService).sendMail('W3B Plan ended: ' + user.displayName, previousUser.planUntil.toLocaleString());
            }
        }
    }
}
TriggerHandler.register(UserTriggerHandler);

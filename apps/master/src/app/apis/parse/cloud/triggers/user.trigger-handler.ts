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
        const profile = await this.getAuthProfile(user);
        const newUser = user.broadcasterSecret ? false : true;

        if (profile.provider === 'twitch') {
            user.twitchUserData = profile.data;
            if(user.twitchUserData.email) {
                user.email = user.twitchUserData.email;
            } else {
                user.unsetTypeSave('email');
            }
            user.displayName = user.twitchUserData.display_name;
        } else {
            user['battleNetUserData'] = profile.data;
            user.unsetTypeSave('email');
            user.displayName = profile.data?.battletag || 'Battle.net user';
        }

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
        console.log((newUser) ? 'New user created:' : 'User updated by auth data:');
        console.log(user);
    }

    private async getAuthProfile(user: User): Promise<{ provider: 'twitch' | 'battlenet'; data: any }> {
        const authData: any = user.authData;
        if (authData?.twitch) {
            const twitchDetails = await this.getTwitchUser(String(authData.twitch.id), authData.twitch.access_token);
            return { provider: 'twitch', data: twitchDetails };
        }

        if (authData?.battlenet) {
            const battleNetDetails = await this.getBattleNetUser(authData.battlenet.access_token);
            return { provider: 'battlenet', data: battleNetDetails };
        }

        throw new Error('No supported auth provider found for user.');
    }

    private getTwitchUser(id: string, token: string) {
        return this.getJson({
            hostname: 'api.twitch.tv',
            path: '/helix/users',
            headers: {
                Authorization: 'Bearer ' + token,
                'Client-ID': appConfig.TWITCH_CLIENT_ID
            }
        }).then((response: any) => {
            if (response && (response.data) && (response.data[0]) && response.data[0].id == id) {
                return response.data[0];
            }
            throw new Error('Twitch profile response did not match user auth data.');
        });
    }

    private getBattleNetUser(token: string) {
        return this.getJson({
            hostname: `${appConfig.BATTLENET_REGION}.battle.net`,
            path: '/oauth/userinfo',
            headers: {
                Authorization: 'Bearer ' + token
            }
        });
    }

    private getJson(options: https.RequestOptions) {
        return new Promise((resolve, reject) => {
            https.get(options, function (res) {
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
                reject('Failed to load auth profile.');
            });
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

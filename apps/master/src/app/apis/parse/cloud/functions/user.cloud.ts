import { UserService } from './../../../../data/common/modelservices/user.service';
import { BaseCloud } from './base/base-cloud';
import { ServiceManager, DiscordService, Parse } from 'app/data/services';
import { User } from 'app/data/models';
import { appConfig } from 'app/config';
import * as https from 'https';


class UserCloud extends BaseCloud {
    private discordService = ServiceManager.get(DiscordService);

    constructor() {
        super('UserCloud');
        this.registerMethod('connectDiscord', this.connectDiscord);
        this.registerMethod('disconnectDiscord', this.disconnectDiscord);
        this.registerMethod('connectExternalAccount', this.connectExternalAccount);
    }

    public async connectDiscord(user: User, code: string) {
        if (user && code) {
            const discordUserData = await this.discordService.getUserDataByCode(code);
            if (discordUserData) {
                user.discordUserData = discordUserData;
                this.discordService.addDefaultRole(user.discordUserData);
                if (user.isProPlan()) {
                    this.discordService.addProRole(user.discordUserData);
                }
                await user.save();
                return user;
            }
            return null;
        }
    }

    public async disconnectDiscord(user: User) {
        if (user && user.discordUserData) {
            this.discordService.removeDefaultRole(user.discordUserData);
            if (user.isProPlan()) {
                this.discordService.removeProRole(user.discordUserData);
            }
            user.discordUserData = null;
            await user.save();
            return true;
        }
    }

    public async connectExternalAccount(user: User, provider: 'twitch' | 'battlenet', id: string, accessToken: string) {
        if (!user) {
            throw new Parse.Error(Parse.Error.SESSION_MISSING, 'Login before connecting an external account.');
        }
        if (!provider || !id || !accessToken) {
            throw new Parse.Error(Parse.Error.VALIDATION_ERROR, 'Missing external account credentials.');
        }

        const account = provider === 'twitch'
            ? await this.getVerifiedTwitchAccount(id, accessToken)
            : await this.getVerifiedBattleNetAccount(id, accessToken);
        await this.assertAccountIsAvailable(user, account.provider, account.id);

        const connectedAccounts = (user.connectedAccounts || []).filter(existing =>
            !(existing.provider === account.provider && String(existing.id) === account.id)
        );
        connectedAccounts.push(account);
        user.connectedAccounts = connectedAccounts;
        this.rebuildConnectedAccountIndexes(user);

        if (account.provider === 'twitch') {
            user.twitchUserData = {
                ...(user.twitchUserData || {} as any),
                id: account.id,
                login: account.login,
                display_name: account.displayName,
                profile_image_url: account.avatarUrl,
                email: account.email
            } as any;
            if (!user.displayName || user.displayName === 'Battle.net user') {
                user.displayName = account.displayName || account.login;
            }
            if (account.email) {
                user.email = account.email;
            }
        } else if (!user.displayName) {
            user.displayName = account.displayName || 'Battle.net user';
        }

        await user.save();
        return this.toPublicConnectedAccount(account);
    }

    private async assertAccountIsAvailable(user: User, provider: 'twitch' | 'battlenet', id: string) {
        const query = new Parse.Query(User);
        query.equalTo(provider === 'twitch' ? 'connectedTwitchIds' : 'connectedBattleNetIds', id);
        const existing = await query.first({ useMasterKey: true });
        if (existing && existing.id !== user.id) {
            throw new Parse.Error(Parse.Error.ACCOUNT_ALREADY_LINKED, 'This external account is already connected to another W3Booster account.');
        }
    }

    private async getVerifiedTwitchAccount(id: string, token: string) {
        const response: any = await this.getJson({
            hostname: 'api.twitch.tv',
            path: '/helix/users',
            headers: {
                Authorization: 'Bearer ' + token,
                'Client-ID': appConfig.TWITCH_CLIENT_ID
            }
        });
        const twitchUser = response?.data?.[0];
        if (!twitchUser || String(twitchUser.id) !== String(id)) {
            throw new Parse.Error(Parse.Error.VALIDATION_ERROR, 'Twitch profile response did not match the auth token.');
        }
        return {
            provider: 'twitch' as const,
            id: String(twitchUser.id),
            login: String(twitchUser.login || '').toLowerCase(),
            displayName: twitchUser.display_name || twitchUser.login,
            avatarUrl: twitchUser.profile_image_url,
            email: twitchUser.email,
            connectedAt: new Date().toISOString()
        };
    }

    private async getVerifiedBattleNetAccount(id: string, token: string) {
        const battleNetUser: any = await this.getJson({
            hostname: `${appConfig.BATTLENET_REGION}.battle.net`,
            path: '/oauth/userinfo',
            headers: {
                Authorization: 'Bearer ' + token
            }
        });
        const battleNetId = String(battleNetUser?.id || '');
        if (!battleNetId || battleNetId !== String(id)) {
            throw new Parse.Error(Parse.Error.VALIDATION_ERROR, 'Battle.net profile response did not match the auth token.');
        }
        return {
            provider: 'battlenet' as const,
            id: battleNetId,
            login: battleNetUser.battletag,
            displayName: battleNetUser.battletag,
            connectedAt: new Date().toISOString()
        };
    }

    private rebuildConnectedAccountIndexes(user: User) {
        user.connectedTwitchIds = user.connectedAccounts
            .filter(account => account.provider === 'twitch')
            .map(account => String(account.id));
        user.connectedTwitchLogins = user.connectedAccounts
            .filter(account => account.provider === 'twitch' && account.login)
            .map(account => String(account.login).toLowerCase());
        user.connectedBattleNetIds = user.connectedAccounts
            .filter(account => account.provider === 'battlenet')
            .map(account => String(account.id));
    }

    private toPublicConnectedAccount(account) {
        return {
            provider: account.provider,
            id: account.id,
            login: account.login,
            displayName: account.displayName,
            avatarUrl: account.avatarUrl,
            connectedAt: account.connectedAt
        };
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
}
BaseCloud.register(UserCloud);

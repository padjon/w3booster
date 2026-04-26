import * as https from 'https';
import { Parse } from 'app/data/services';
import { appConfig } from 'app/config';

export class BattleNetAuthAdapter {
    public validateAuthData(authData) {
        return this.getUserInfo(authData.access_token).then((profile: any) => {
            const profileId = String(profile?.sub ?? profile?.id ?? '');
            if (profileId && profileId === String(authData.id)) {
                return;
            }

            throw new Parse.Error(
                (Parse.Error as any).OBJECT_NOT_FOUND,
                'Battle.net auth is invalid for this user.');
        });
    }

    public validateAppId() {
        return Promise.resolve();
    }

    private getUserInfo(token: string) {
        return new Promise((resolve, reject) => {
            https.get({
                hostname: `${appConfig.BATTLENET_REGION}.battle.net`,
                path: '/oauth/userinfo',
                headers: {
                    Authorization: 'Bearer ' + token
                }
            }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        reject(e);
                    }
                });
            }).on('error', () => {
                reject('Failed to validate this access token with Battle.net.');
            });
        });
    }
}

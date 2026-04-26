import * as https from 'https';
import { Parse } from 'app/data/services';
import { appConfig } from 'app/config';

export class TwitchAuthAdapter {
    // Returns a promise that fulfills if this user id is valid.
    public validateAuthData(authData) {
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
                console.log(response);
                if (response && (response.data) && (response.data[0]) && response.data[0].id == id) {
                    return;
                }
                throw new Parse.Error(
                    (Parse.Error as any).OBJECT_NOT_FOUND,
                    'Twitch auth is invalid for this user.');
            });
        })(authData.id, authData.access_token).then(() => {
            // Validation with auth token worked
            return;
        });
    }

    // Returns a promise that fulfills if this app id is valid.
    public validateAppId() {
        console.warn('JAAAAJAAA');
        return Promise.resolve();
    }
}
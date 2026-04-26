import { IMainAccount, ERace } from 'app/data/models';
import { appConfig } from 'app/config';
import { Webclient } from 'app/data/services';


export class W3AliasService {

    readonly warcraftInfoAPIClientID = (appConfig.isDevMode ) ? 'guoLL0wdh2m' : 'G5aZRxmCBbX';
    readonly warcraftInfoAPIRaceMap = new Map<string, ERace>().set('Nightelf', ERace.NIGHT_ELF).set('Undead', ERace.UNDEAD).set('Human', ERace.HUMAN).set('Orc', ERace.ORC).set('Random', ERace.RANDOM);

    private aliasCache = new Map<string, Promise<IMainAccount>>();
    private aliasCacheNullResults = new Map<string, number>();
    readonly cacheTime = 1000 * 30; // 30 Seconds

    public constructor() {
        console.log('using warcraft3.info client id: ' + this.warcraftInfoAPIClientID);
    }

    public getMainAccount(playerName: string, realm: string): Promise<IMainAccount> {
        const cacheKey = playerName + '@' + realm;

        if (realm.toLowerCase().indexOf('w3champions') >= 0) {
            realm = 'Reforged';
        }

        if (this.aliasCacheNullResults.has(cacheKey)) {
            const nullResultTime = this.aliasCacheNullResults.get(cacheKey);
            if (new Date().getTime() - nullResultTime > this.cacheTime) {
                this.aliasCacheNullResults.delete(cacheKey);
                this.aliasCache.delete(cacheKey);
            }
        }

        if (this.aliasCache.has(cacheKey)) {
            console.log('Used cache alias request of ' + cacheKey);
            return this.aliasCache.get(cacheKey);
        }

        const promise = new Promise<IMainAccount>(async (resolve, reject) => {
            if (!playerName || !realm) {
                resolve(null);
            } else {

                if (realm.toLowerCase() != 'netease') {
                    realm = 'Battle.net';
                }

                try {
                    const data = await Webclient.post('https://warcraft3.info/api/v1/aka', { 'aka': playerName, 'platform': realm }, 5000,{ 'Client-ID': this.warcraftInfoAPIClientID });
                    if (data.name) {
                        const mainAccount: IMainAccount = { name: data.name };
                        if (data.main_race) {
                            mainAccount.mainRace = this.warcraftInfoAPIRaceMap.get(data.main_race);
                        }
                        if (data.country) {
                            mainAccount.country = data.country;
                        }
                        console.log('Real user detected for account: ' + playerName);
                        console.log(mainAccount);
                        this.aliasCacheNullResults.delete(cacheKey);
                        resolve(mainAccount);
                    } else {
                        this.aliasCacheNullResults.set(cacheKey, new Date().getTime());
                        resolve(null);
                    }

                } catch(err) {
                    console.warn('ERROR FROM REAL-PLAYER API of Warcraft3.info:');
                    console.warn(err);
                    this.aliasCacheNullResults.set(cacheKey, new Date().getTime());
                    resolve(null);
                    this.aliasCache.delete(cacheKey);
                }
            }
        });

        this.aliasCache.set(cacheKey, promise);
        return promise;
    }
}

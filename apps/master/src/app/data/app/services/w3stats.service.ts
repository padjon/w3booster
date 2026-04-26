

import { IPlayerStats, IPlayerStatsObject } from 'app/data/models';
import { ERace, EGameModeEnum } from '../../common/models/transient/state-manager';
import { Webclient } from './webclient.service';

export enum EStatsRace {
    RANDOM = 0,
    HUMAN = 1,
    ORC = 2,
    NIGHT_ELF = 4,
    UNDEAD = 8
}

interface IBnetMessage {
    gameTypes: Array<{
        name: string,
        season: number,
        value: number,
        gameMode: string
    }>;
}

export class W3StatsService {
    private statsCache = new Map<string, { time: number, promise: Promise<IPlayerStats> }>();
    private bnetStats = new Map<string, { time: number, bnetMessage: IBnetMessage }>();
    private w3cSeason = 12;
    readonly cacheTime = 1000 * 30; // 30 Seconds
    readonly raceToStatsRaceMap = new Map<ERace, EStatsRace>()
        .set(ERace.RANDOM, EStatsRace.RANDOM)
        .set(ERace.HUMAN, EStatsRace.HUMAN)
        .set(ERace.ORC, EStatsRace.ORC)
        .set(ERace.NIGHT_ELF, EStatsRace.NIGHT_ELF)
        .set(ERace.UNDEAD, EStatsRace.UNDEAD);

    readonly statsRaceToBnetString = new Map<EStatsRace, string>()
        .set(EStatsRace.RANDOM, 'random')
        .set(EStatsRace.HUMAN, 'human')
        .set(EStatsRace.ORC, 'orc')
        .set(EStatsRace.NIGHT_ELF, 'night_elf')
        .set(EStatsRace.UNDEAD, 'undead');

    readonly bnetGameModes = new Map<string, string>()
        .set('1v1', 'solo')
        .set('2v2', 'team')
        .set('4v4', 'team4')
        .set('sffa', 'ffa');

    public constructor() {
        const checkW3CSeason = async () => {
            try {
                const seasons = (await Webclient.get('https://website-backend.w3champions.com/api/ladder/seasons', 10000)) as Array<{ id: number }>;
                if (seasons && seasons?.length > 0) {
                    const season = Math.max(...seasons.map(s => s.id));
                    if (season != this.w3cSeason) {
                        console.log('Found new active season: ' + season + ' previous: ' + this.w3cSeason);
                        this.w3cSeason = season;
                    }
                }
            } catch (e) { };
        };
        checkW3CSeason();
        setInterval(checkW3CSeason.bind(this), 1000 * 60 * 60);
    }

    setBnetStats(battleTag: string, data: any) {
        console.log('FORWARDED STATS:');
        console.log(data);
        this.bnetStats.set(battleTag.toLowerCase(), {
            time: new Date().getTime(),
            bnetMessage: data
        });
    }

    public getStats(realm: string, playerId: string, race: ERace): Promise<IPlayerStats> {
        const statsRace = this.raceToStatsRaceMap.get(race);
        const ident = realm + playerId;
        const cachedObject = this.statsCache.get(ident);
        if (cachedObject && (new Date().getTime() - cachedObject.time < this.cacheTime)) {
            console.log('Loaded stats from cache for :' + ident);
            return cachedObject.promise;
        }

        const promise = new Promise<IPlayerStats>(async (resolve, reject) => {
            let url = '';

            if (realm == 'Netease') {
                url = 'http://service.dz.163.com/new_platformwar3/war3/persondata_1v1?guid=' + playerId;
            } else if (realm.toLowerCase().indexOf('w3champions') >= 0) {
                let gateway = 20;
                if (realm.toLowerCase().indexOf('w3champions@na') >= 0) {
                    gateway = 10;
                }
                // url = 'https://matchmaking-service.w3champions.com/player/' + playerId.replace(/\#/, '%23') + '/' + gateway + '/w3b-stats';
                url = 'https://website-backend.w3champions.com/api/players/' + playerId.replace(/\#/, '%23') + '/game-mode-stats?gateWay=20&season=' + this.w3cSeason;

                //url = 'https://website-backend.w3champions.com/api/ladder/search?gateWay=20&searchFor=' + playerId.split('#')[0] + '&gameMode=1&season=' + this.w3cSeason;
                console.log(realm);
                console.log(gateway);
                console.log(url);
            } else {
                const checkFunction = () => {
                    const bnetObject = this.bnetStats.get(playerId.toLowerCase());
                    if (bnetObject && new Date().getTime() - bnetObject.time < 60000) {
                        const playerStats: IPlayerStats = {
                            solo: { wins: 0, losses: 0, winRate: 0, level: 0, rank: 0 },
                            team: { wins: 0, losses: 0, winRate: 0, level: 0, rank: 0 },
                            team4: { wins: 0, losses: 0, winRate: 0, level: 0, rank: 0 },
                            ffa: { wins: 0, losses: 0, winRate: 0, level: 0, rank: 0 }
                        };


                        const race = this.statsRaceToBnetString.get(statsRace);
                        const entries = bnetObject.bnetMessage.gameTypes.filter(gt => gt.season == 1 && gt.name.startsWith(this.statsRaceToBnetString.get(statsRace)));
                        for (const entry of entries) {
                            const supportedGameMode = this.bnetGameModes.get(entry.gameMode);
                            if (supportedGameMode) {
                                const gmStats = playerStats[supportedGameMode];
                                if (gmStats) {
                                    switch (entry.name) {
                                        case race + '_wins':
                                            gmStats.wins = entry.value;
                                            break;
                                        case race + '_losses':
                                            gmStats.losses = entry.value;
                                            break;
                                    }
                                }
                            }
                        }

                        for (const key of Object.keys(playerStats)) {
                            const obj = playerStats[key];
                            const amountOfGames = obj.wins + obj.losses;
                            playerStats[key].winRate = (amountOfGames == 0) ? 0 : (obj.wins / amountOfGames * 100);
                        }

                        resolve(playerStats);
                        return true;
                    }
                    return false;
                };
                let intervalCount = 0;
                const intervalHandler = setInterval(() => {
                    if (checkFunction()) {
                        clearInterval(intervalHandler);
                        console.log('FOUND STATS FOR ' + playerId);
                    } else if (intervalCount++ > 9) {
                        clearInterval(intervalHandler);
                        console.log('CANCELED REQUEST FOR ' + playerId);
                        resolve(null);
                    }
                }, 1000);
            }

            if (url) {
                try {
                    const data = await Webclient.get(url, 10000);
                    if (realm == 'Netease') {
                        console.log(url);
                        console.log(data);
                        if (data && data.hasOwnProperty('qf_win') && data.hasOwnProperty('qf_lose')) {
                            const playerStats: IPlayerStats = { solo: { wins: data.qf_win, losses: data.qf_lose, level: data.qf_level, rank: data.qf_rank, winRate: 0 }, team: undefined, team4: undefined, ffa: undefined };
                            const amountOfGames = (playerStats.solo.wins + playerStats.solo.losses);
                            playerStats.solo.winRate = (amountOfGames == 0) ? 0 : (playerStats.solo.wins / (playerStats.solo.wins + playerStats.solo.losses) * 100);
                            try {
                                const data2v2 = await Webclient.get(url.replace('1v1', '2v2'), 10000);
                                if (data2v2 && data2v2.hasOwnProperty('qf_win') && data2v2.hasOwnProperty('qf_lose')) {
                                    playerStats.team = { wins: data2v2.qf_win, losses: data2v2.qf_lose, level: data2v2.qf_level, rank: data2v2.qf_rank, winRate: 0 };
                                    const amountOfGames = (playerStats.team.wins + playerStats.team.losses);
                                    playerStats.team.winRate = (amountOfGames == 0) ? 0 : (playerStats.team.wins / (playerStats.team.wins + playerStats.team.losses) * 100);
                                }
                            } catch (e) { }
                            resolve(playerStats);
                        } else {
                            resolve(null);
                        }
                    } else if (realm.toLowerCase().indexOf('w3champions') >= 0) {
                        /* alternative implementation 
                        const data = JSON.parse(body);
                        if (!data) {
                            resolve(null);
                        } else {
                            const playerStats: IPlayerStats = {
                                solo: { wins: 0, losses: 0, winRate: 0, level: 0, rank: 0 },
                                team: { wins: 0, losses: 0, winRate: 0, level: 0, rank: 0 },
                                team4: { wins: 0, losses: 0, winRate: 0, level: 0, rank: 0 },
                                ffa: { wins: 0, losses: 0, winRate: 0, level: 0, rank: 0 }
                            };

                            const filteredData = data.filter(p => p.player1Id.toLowerCase() == playerId.toLowerCase() && p.season != 0);
                            for (const itemWrapper of filteredData as Array<{  league: number, rankNumber: number, player: { race: EStatsRace, gameMode: number, wins: number, losses: number,  winRate: number } }>) {
                                const resultItem = itemWrapper.player as any as IPlayerStatsObject;
                                resultItem.league = itemWrapper.league;
                                resultItem.rank = itemWrapper.rankNumber;
                                if (itemWrapper.player.race === statsRace || itemWrapper.player.race === null) {
                                    if (itemWrapper.player.gameMode == 1) {
                                        playerStats.solo = resultItem;
                                    } else if (itemWrapper.player.gameMode == 2) {
                                        playerStats.team = resultItem;
                                    } else if (itemWrapper.player.gameMode == 4) {
                                        playerStats.team4 = resultItem;
                                    } else if (itemWrapper.player.gameMode == 5) {
                                        playerStats.ffa = resultItem;
                                    }
                                }
                            }

                            for (const key of Object.keys(playerStats)) {
                                const obj = playerStats[key];
                                const amountOfGames = obj.wins + obj.losses;
                                playerStats[key].winRate = (amountOfGames == 0) ? 0 : (obj.wins / amountOfGames * 100);
                            }
                            resolve(playerStats);*/

                        /* default implementation 
                        console.log(body);*/
                        if (!data) {
                            resolve(null);
                        } else {
                            const playerStats: IPlayerStats = {
                                solo: { wins: 0, losses: 0, winRate: 0, level: 0, rank: 0 },
                                team: { wins: 0, losses: 0, winRate: 0, level: 0, rank: 0 },
                                team4: { wins: 0, losses: 0, winRate: 0, level: 0, rank: 0 },
                                ffa: { wins: 0, losses: 0, winRate: 0, level: 0, rank: 0 }
                            };

                            for (const item of data as Array<{ race: EStatsRace, gameMode: number, wins: number, losses: number, rank: number, leagueOrder: number, winRate: number, level: number }>) {
                                if (item.race === statsRace || item.race === null) {
                                    if (item.gameMode == 1) {
                                        playerStats.solo = item;
                                    } else if (item.gameMode == 2) {
                                        playerStats.team = item;
                                    } else if (item.gameMode == 4) {
                                        playerStats.team4 = item;
                                    } else if (item.gameMode == 5) {
                                        playerStats.ffa = item;
                                    }
                                }
                            }

                            for (const key of Object.keys(playerStats)) {
                                const obj = playerStats[key];
                                const amountOfGames = obj.wins + obj.losses;
                                playerStats[key].winRate = (amountOfGames == 0) ? 0 : (obj.wins / amountOfGames * 100);
                                playerStats[key].league = playerStats[key].leagueOrder;
                            }
                            resolve(playerStats);
                        }
                    }

                } catch (err) {
                    console.log(err);
                    resolve(null);
                    this.statsCache.delete(ident);
                }
            }
        });
        this.statsCache.set(ident, { time: new Date().getTime(), promise: promise });

        return promise;
    }
}
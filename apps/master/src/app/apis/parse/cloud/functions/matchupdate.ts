import { StateManager } from 'app/apis/w3stream/state-manager';
import { EGameStateEnum } from 'app/data/common/models';

const NodeRSA = require('node-rsa');
const key = new NodeRSA('-----BEGIN RSA PRIVATE KEY-----\n' +
    'MIIEogIBAAKCAQEAsEkMrOCRfgexjd9VarXiP+J5nZ3QTn0c2YdNIM9upufbU6It\n' +
    'GEEQBaxMHJD2ijRXVdfY9dv9eooiCzHTgzkCwiiO5S9oFuDIQbmlCRMHIvv5Lgyf\n' +
    'YICwCfys7ZmVReIiNnBsGWfPN24FZV5hUKkruvdNsees1hpXHRXa85I/QyxTqjHu\n' +
    '8yJWVUp6Fi3paTfLH/OuCwD13Bk/4c/ityBDerI3h0SZ/yO0Pj2cRL7GFC4djW2l\n' +
    '8cdFm51g5bzSO/9DsB2xbdXbUYpcagFdd604GIfD8M1sToasjYw2ZVb8RhvSOY90\n' +
    'fw9xA05as1zCN0DZsM10DwriW9qu+ei1U8Tj/QIDAQABAoIBACbj1rIE0NQW6mq8\n' +
    'DGIAQiuJ0P6epCfMniK3IKLOYEDeAZrPulcRc3Fs81WR/XG73lCHz8tdfuwbsSr7\n' +
    'EQhv+VXQEMYq0THK4SLuy6PW2Mo1AGHSUw69FRj+7z9zlGTYYGfWIWLxbdtyoCoe\n' +
    'yiU7TPRwPmmzDIQnR3SZL7ZwWxh8PwPVlciLviOTZ8swXeQU51Zjx4qBVBvq97rx\n' +
    'EdVwFj8vCXLX4ElSTvuH5vZrl03X7G+F4BXbIVQT9vuv4xYgy3d0zK6CmIundj90\n' +
    'VtLbsfA5Z8KoXBrzI01q4ar3EFF2OQhAh4g8p6Y7q3tWu3kH8EzbTvq7//mP0L7w\n' +
    'mCnDRIECgYEA4o7F6DRuVeRLkGUf3OQ5CLAJLNyG8vE9ByyhtUAtDKGInvIHGuTB\n' +
    'gdRGgr+ttgrzALZuLDpncGXxurb5p/XnFeAmAOog5E3vn592tHV67L1/BKSUP9x6\n' +
    'Q+nyov9hGcn2/4zB4IsYM3GvnzmwkO9KN0c8SsebwCpB552IW0jfQPECgYEAxzHK\n' +
    '1WCDXh7hmiTIDclT+SmjE/aLUUOfEdNxu1HfxzRK6Iwmq6quQizu4An2J1kHpxoH\n' +
    'c0aiLPoVRGDbMmISoFVT8A63JE2C1eH5f2mg3/Mb3tl7vIR6AdxmIxI7PGOX1dqQ\n' +
    'dYUMmLS57zsqP4VzXt2oUv6kqlQp3CuWzBnsE80CgYBxovtRhTryihf8zTw2J6MT\n' +
    '4Hg5sENgB/B8cL6Lky0FcOB+GRfHPYZyAG99lXckIEnSya5pMMJBdmDRLoX64TSP\n' +
    'nGZzfvwQh6bxgaKg0Wxe4o2bXpGdlpEdD3NMnputu8fQVmHIpvv0kcltLBqMF/o5\n' +
    'z9lGCOjuckOsUS/b2alhgQKBgHnJWq8M/CSekuaQmHO9ZQcQyvEYquM7idT3RzD1\n' +
    'BPGhai82CSqqBzLUkBQQYxx5lXE4O9fiFqOTH0+YPExYo/S9Vr2N8bFTZqvoJogd\n' +
    'B8wEskSVCc8f3AypORU2P1tTtPB+WhZQC3yN+qRmsxT1Pa2BrjlYEUtGe/Vt/Ru6\n' +
    'uZj9AoGARxeoiWqmAkmfM6se9eH3v8a5fGpD9VytS0cnf136HTWrm20NP3xoE8PP\n' +
    'ZCBR9a44XawcogHsmhc0t5PIPp4qL/cnDuzMr2rd8UtcvATgAO2H2KE5h4VYQhmD\n' +
    'uifI4LgLm8o13JtRe8j2oGHL/wLYDCnZdaB4jxYUOcL6lwr/NXs=\n' +
    '-----END RSA PRIVATE KEY-----');



enum ERecorderMessageType {
    RECORDER_STATE,
    LOCAL_MATCHUP,
    LOCAL_GAMEDATA,
    GAMEDATA,
    MATCHUP,
    MATCHSCORE,
    PING,
    SWITCH_PLATFORM,
    REQUEST_ADMIN,
    GAMETIME,
}

enum ERecorderStates {
    UNEXPECTED_EXCEPTION,
    INITIALIZING,
    INITIALIZED,
    PRE_W3_LOOKUP,
    WAITING_FOR_W3,
    WAITING_FOR_64BIT_W3,
    ANALYZING_W3,
    ADMIN_REQUIRED,
    PRE_GAME_LOOKUP,
    WAITING_FOR_GAME,
    GAME_STARTING,
    GAME_STARTED,
    GAME_RUNNING,
    GAME_ENDED,
    RECORDER_STOPS
}

export const userPings = new Map<string, number>();
const mapping = new Map<ERecorderStates, EGameStateEnum>()
    // .set(ERecorderStates.GAME_STARTED, EGameStateEnum.GAME_START)
    .set(ERecorderStates.GAME_RUNNING, EGameStateEnum.GAME_RUNNING)
    .set(ERecorderStates.GAME_ENDED, EGameStateEnum.GAME_FINISHED)
    .set(ERecorderStates.RECORDER_STOPS, EGameStateEnum.NO_GAME);

export async function matchUpdate(userId, type: ERecorderMessageType, data) {
    if (userId) {
        const userStateManager = await StateManager.getByUserId(userId);
        if (userStateManager) {
            if (type == ERecorderMessageType.RECORDER_STATE) {
                const state = Number(data);
                console.log('RECORDER STATE CHANGED: ' + state);
                if (mapping.has(state)) {
                    userStateManager.updateGameState(mapping.get(state));
                } else if (userStateManager.isGameRunning() && state < ERecorderStates.GAME_STARTING) {
                    userStateManager.updateGameState(EGameStateEnum.NO_GAME);
                }

            } else if (type == ERecorderMessageType.PING) {
                userPings[userId] = Date.now();
            } else if (type == ERecorderMessageType.GAMEDATA || type == ERecorderMessageType.LOCAL_MATCHUP) {
                let updates = undefined;
                if (type == ERecorderMessageType.GAMEDATA) {
                    let decrypted = '';
                    for (const chunk of data.split('==')) {
                        decrypted += key.decrypt(chunk + '==', 'utf8');
                    }
                    updates = JSON.parse(decrypted) as Array<any>;
                } else {
                    updates = JSON.parse(data) as Array<any>;
                }
                for (const update of updates) {
                    if (update.class == 'W3Game') {
                        userStateManager.updateGameState(EGameStateEnum.GAME_START, update);
                    } else if (update.class == 'W3GameResult') {
                        // could store game results here
                    } else {
                        userStateManager.updateStateByUpdate(update);
                    }
                }
            } else if (type == ERecorderMessageType.MATCHSCORE) {
                const update = { class: 'W3MatchScore', value: { wins: data.wins, losses: data.losses } };
                userStateManager.updateStateByUpdate(update);
            }
        }
    }
    return;
}
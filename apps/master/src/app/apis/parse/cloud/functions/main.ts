import { ServiceManager, W3StatsService } from 'app/data/services';
import { UserService, UserLogService } from 'app/data/modelservices';
import { UserLog, User, EGameStateEnum } from 'app/data/models';
import { userPings, matchUpdate } from './matchupdate';
import { StateManager } from 'app/apis/w3stream/state-manager';

// cold start, to prevent overwhelming the system
setInterval(() => {
    userPings.forEach((time, userId) => {
        if (Date.now() - time > 30000) {
            StateManager.getByUserId(userId).then(userStateManager => {
                if (userStateManager.isGameRunning()) {
                    userStateManager.updateGameState(EGameStateEnum.NO_GAME);
                }
                userPings.delete(userId);
            });
        }
    });
}, 5000);
;
Parse.Cloud.define('matchUpdate', (request) => {
    if (request.user && request.user.id) {
        matchUpdate(request.user.id, request.params['type'], request.params['data']);
    }
});

Parse.Cloud.define('reportBnetStats', (request) => {
    if (request.params?.data && request.params?.battleTag) {
        ServiceManager.get(W3StatsService).setBnetStats(request.params?.battleTag, request.params?.data);
    }
});

Parse.Cloud.define('logUpdate', (request) => {
    /*
    if (request.user) {
        ServiceManager.get(UserService).getByCloudRequest(request).then(user => {
            ServiceManager.get(UserLogService).getFirstByAttribute('user', user).then(log => {
                if (!log) {
                    log = new UserLog();
                    log.user = user;
                }

                log.logs = ((log.logs) ? log.logs : '') + request.params['data'];
                if (log.logs.length > 5000) {
                    log.logs = log.logs.substr(log.logs.length - 5000);
                }
                log.save();
            });
        });
    }
    */
    return;
});
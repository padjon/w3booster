import { UserLog } from '../models';
import { BaseModelService } from 'app/data/common/modelservices/base/base-modelservice';
import { ErrorService, ParseService } from 'app/data/services';




export class UserLogService extends BaseModelService<UserLog> {
    constructor(errorService: ErrorService, parseService: ParseService) {
        super(errorService, parseService, UserLog);
    }
}

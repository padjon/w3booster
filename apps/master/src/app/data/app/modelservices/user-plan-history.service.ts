import { ErrorService, ParseService } from '../../common/services';
import { UserPlanHistory } from '../../models';
import { BaseModelService } from '../../common/modelservices/base/base-modelservice';




export class UserPlanHistoryService extends BaseModelService<UserPlanHistory> {

  constructor(errorService: ErrorService, parseService: ParseService) {
    super(errorService, parseService, UserPlanHistory);
  }
}

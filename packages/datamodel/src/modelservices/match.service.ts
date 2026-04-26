import { ErrorService, ParseService } from '../services';
import { Match } from '../models';
import { BaseModelService } from './base/base-modelservice';



export class MatchService extends BaseModelService<Match> {

  constructor(errorService: ErrorService, parseService: ParseService) {
    super(errorService, parseService, Match);
  }
}

import { ErrorService, ParseService } from '../services';
import { OverlaySettings } from '../models';
import { BaseModelService } from './base/base-modelservice';



export class OverlaySettingsService extends BaseModelService<OverlaySettings> {

  constructor(errorService: ErrorService, parseService: ParseService) {
    super(errorService, parseService, OverlaySettings);
  }
}

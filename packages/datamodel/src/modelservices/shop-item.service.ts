import { ErrorService, ParseService } from '../services';
import { ShopItem } from '../models';
import { BaseModelService } from './base/base-modelservice';



export class ShopItemService extends BaseModelService<ShopItem> {

  constructor(errorService: ErrorService, parseService: ParseService) {
    super(errorService, parseService, ShopItem);
  }
}

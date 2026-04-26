import { UserService } from './../../../../data/common/modelservices/user.service';
import { BaseCloud } from './base/base-cloud';
import { ServiceManager, PaypalService, DiscordService } from 'app/data/services';
import { ShopItemService, ShopOrderService } from 'app/data/modelservices';
import { ShopItem, User, ShopOrder, EUserPlan } from 'app/data/models';


class UserCloud extends BaseCloud {
    private discordService = ServiceManager.get(DiscordService);

    constructor() {
        super('UserCloud');
        this.registerMethod('connectDiscord', this.connectDiscord);
        this.registerMethod('disconnectDiscord', this.disconnectDiscord);
    }

    public async connectDiscord(user: User, code: string) {
        if (user && code) {
            const discordUserData = await this.discordService.getUserDataByCode(code);
            if (discordUserData) {
                user.discordUserData = discordUserData;
                this.discordService.addDefaultRole(user.discordUserData);
                if (user.isProPlan()) {
                    this.discordService.addProRole(user.discordUserData);
                }
                await user.save();
                return user;
            }
            return null;
        }
    }

    public async disconnectDiscord(user: User) {
        if (user && user.discordUserData) {
            this.discordService.removeDefaultRole(user.discordUserData);
            if (user.isProPlan()) {
                this.discordService.removeProRole(user.discordUserData);
            }
            user.discordUserData = null;
            await user.save();
            return true;
        }
    }
}
BaseCloud.register(UserCloud);

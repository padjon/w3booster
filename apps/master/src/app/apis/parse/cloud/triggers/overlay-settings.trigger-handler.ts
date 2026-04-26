import { TriggerHandler } from './base/trigger-handler';
import { UserService, OverlaySettingsService } from 'app/data/modelservices';
import { OverlaySettings } from 'app/data/models';
import { StateManager } from 'app/apis/w3stream/state-manager';
import { ServiceManager } from 'app/data/services';

class OverlaySettingsTriggerHandler extends TriggerHandler<OverlaySettings, OverlaySettingsService> {

    private userManager = ServiceManager.get(UserService);

    constructor() {
        super(OverlaySettings, OverlaySettingsService);
    }

    protected async afterUpdate?(settings: OverlaySettings, previousSettings: OverlaySettings) {
        this.updateUserStateManager(settings);
    }

    protected async updateUserStateManager(settings: OverlaySettings) {
        const user = await this.userManager.getFirstByAttribute(['playerOverlaySettings', 'obsOverlaySettings'], settings);
        const userStateManager = await StateManager.getByUser(user) 
        userStateManager.onSettingsChanged();
    }
}
TriggerHandler.register(OverlaySettingsTriggerHandler);

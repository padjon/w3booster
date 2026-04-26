import { Component } from '@angular/core';

import { User } from 'app/data/models';
import { MockDataService } from '../../services/mock-data.service';
import { OverlayConfigService } from '../../services/overlay-config.service';

@Component({
    selector: 'app-overlay-library-page',
    templateUrl: './overlay-library-page.component.html',
    styleUrls: ['../dashboard-page.css']
})
export class OverlayLibraryPageComponent {
    public presets = this.data.getOverlayPresets();

    constructor(public data: MockDataService, public overlayConfig: OverlayConfigService) {}

    public get user(): User {
        return this.overlayConfig.user;
    }

    public copyOverlayUrl(input: HTMLInputElement): void {
        input.select();
        document.execCommand('copy');
    }
}

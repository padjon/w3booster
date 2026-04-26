import { Component } from '@angular/core';

import { MockDataService } from '../../services/mock-data.service';

@Component({
    selector: 'app-stream-hub-page',
    templateUrl: './stream-hub-page.component.html',
    styleUrls: ['../dashboard-page.css']
})
export class StreamHubPageComponent {
    public rules = this.data.getAutomationRules();
    public presets = this.data.getOverlayPresets();

    constructor(public data: MockDataService) {}
}

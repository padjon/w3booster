import { Component } from '@angular/core';

import { MockDataService } from '../../services/mock-data.service';

@Component({
    selector: 'app-insights-page',
    templateUrl: './insights-page.component.html',
    styleUrls: ['../dashboard-page.css']
})
export class InsightsPageComponent {
    public replays = this.data.getReplays();

    constructor(public data: MockDataService) {}
}

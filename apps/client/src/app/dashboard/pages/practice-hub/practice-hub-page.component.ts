import { Component } from '@angular/core';

import { MockDataService } from '../../services/mock-data.service';

@Component({
    selector: 'app-practice-hub-page',
    templateUrl: './practice-hub-page.component.html',
    styleUrls: ['../dashboard-page.css']
})
export class PracticeHubPageComponent {
    public replays = this.data.getReplays().slice(0, 3);
    public buildOrders = this.data.getBuildOrders();

    constructor(public data: MockDataService) {}
}

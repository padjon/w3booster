import { Component } from '@angular/core';

import { MockDataService } from '../../services/mock-data.service';

@Component({
    selector: 'app-automation-page',
    templateUrl: './automation-page.component.html',
    styleUrls: ['../dashboard-page.css']
})
export class AutomationPageComponent {
    public rules = this.data.getAutomationRules();
    public eventLog = this.data.getEventLog();

    constructor(public data: MockDataService) {}
}

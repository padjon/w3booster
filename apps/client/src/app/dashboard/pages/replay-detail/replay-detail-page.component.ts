import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { MockDataService, MockReplay } from '../../services/mock-data.service';

@Component({
    selector: 'app-replay-detail-page',
    templateUrl: './replay-detail-page.component.html',
    styleUrls: ['../dashboard-page.css']
})
export class ReplayDetailPageComponent implements OnInit {
    public replay: MockReplay;

    constructor(public data: MockDataService, private route: ActivatedRoute) {}

    public ngOnInit(): void {
        const id = this.route.snapshot.params.id;
        this.replay = this.data.getReplays().find(item => item.id === id) || this.data.getReplays()[0];
    }
}

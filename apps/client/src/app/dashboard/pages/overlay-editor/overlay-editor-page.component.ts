import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { MockDataService, MockOverlayPreset } from '../../services/mock-data.service';

@Component({
    selector: 'app-overlay-editor-page',
    templateUrl: './overlay-editor-page.component.html',
    styleUrls: ['../dashboard-page.css']
})
export class OverlayEditorPageComponent implements OnInit {
    public preset: MockOverlayPreset;

    constructor(public data: MockDataService, private route: ActivatedRoute) {}

    public ngOnInit(): void {
        const id = this.route.snapshot.params.id;
        this.preset = this.data.getOverlayPresets().find(item => item.id === id) || this.data.getOverlayPresets()[0];
    }
}

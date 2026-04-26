import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-public-profile-page',
    templateUrl: './public-profile-page.component.html',
    styleUrls: ['../public-page.css']
})
export class PublicProfilePageComponent implements OnInit {
    public handle = '';

    constructor(private route: ActivatedRoute) {}

    public ngOnInit(): void {
        this.handle = this.route.snapshot.params.handle || 'player';
    }
}

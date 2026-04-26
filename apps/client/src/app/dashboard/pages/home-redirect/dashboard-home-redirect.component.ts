import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { PersonaService } from '../../services/persona.service';

@Component({
    selector: 'app-dashboard-home-redirect',
    template: ''
})
export class DashboardHomeRedirectComponent implements OnInit {
    constructor(private persona: PersonaService, private router: Router) {}

    public ngOnInit(): void {
        this.router.navigateByUrl(this.persona.dashboardHome());
    }
}

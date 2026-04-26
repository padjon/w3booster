import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, UrlTree } from '@angular/router';

import { PersonaService } from '../services/persona.service';

@Injectable()
export class PersonaGuard implements CanActivate {
    constructor(private persona: PersonaService, private router: Router) {}

    public canActivate(route: ActivatedRouteSnapshot): boolean | UrlTree {
        const requiredPersona = route.data.persona as 'player' | 'streamer';
        const requiresDeveloper = route.data.developer === true;
        const state = this.persona.state;

        if (requiresDeveloper && !this.persona.isDev(state)) {
            return this.router.parseUrl(this.persona.dashboardHome(state));
        }

        if (requiredPersona === 'player' && state.persona === 'streamer') {
            return this.router.parseUrl('/dashboard/stream');
        }

        if (requiredPersona === 'streamer' && state.persona === 'player') {
            return this.router.parseUrl('/dashboard/practice');
        }

        return true;
    }
}

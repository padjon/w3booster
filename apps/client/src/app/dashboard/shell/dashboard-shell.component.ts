import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { User } from 'app/data/models';
import { AuthenticationService, NodeService } from 'app/data/services';
import { PersonaService, PersonaState } from '../services/persona.service';

interface NavItem {
    label: string;
    icon: string;
    route: string;
    group: 'player' | 'streamer' | 'shared' | 'developer';
    persona?: 'player' | 'streamer';
    developer?: boolean;
}

@Component({
    selector: 'app-dashboard-shell',
    templateUrl: './dashboard-shell.component.html',
    styleUrls: ['./dashboard-shell.component.css']
})
export class DashboardShellComponent implements OnInit, OnDestroy {
    public user: User;
    public desktop = false;
    public state: PersonaState;
    public navItems: NavItem[] = [
        { label: 'Stream Hub', icon: 'fa fa-broadcast-tower', route: '/dashboard/stream', group: 'streamer', persona: 'streamer' },
        { label: 'Overlays', icon: 'fa fa-layer-group', route: '/dashboard/overlays', group: 'streamer', persona: 'streamer' },
        { label: 'Automation', icon: 'fa fa-robot', route: '/dashboard/automation', group: 'streamer', persona: 'streamer' },
        { label: 'Practice Hub', icon: 'fa fa-crosshairs', route: '/dashboard/practice', group: 'player', persona: 'player' },
        { label: 'Build Orders', icon: 'fa fa-list-ol', route: '/dashboard/build-orders', group: 'player', persona: 'player' },
        { label: 'Match Insights', icon: 'fa fa-chart-line', route: '/dashboard/insights', group: 'player', persona: 'player' },
        { label: 'Account', icon: 'fa fa-user', route: '/dashboard/account', group: 'shared' },
        { label: 'Developers', icon: 'fa fa-code', route: '/dashboard/developers', group: 'developer', developer: true },
        { label: 'Legacy dashboard', icon: 'fa fa-th-large', route: '/dashboard/legacy', group: 'shared' }
    ];

    private subscription: Subscription;

    constructor(
        public persona: PersonaService,
        private authentication: AuthenticationService,
        private node: NodeService,
        private router: Router
    ) {}

    public ngOnInit(): void {
        this.user = this.authentication.getAuthenticatedUser();
        this.desktop = this.node.isAvailable();
        this.subscription = this.persona.state$.subscribe(state => this.state = state);
    }

    public ngOnDestroy(): void {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
    }

    public visibleItems(group: NavItem['group']): NavItem[] {
        return this.navItems.filter(item => item.group === group && this.isVisible(item));
    }

    public isVisible(item: NavItem): boolean {
        if (item.developer) {
            return this.persona.isDev(this.state);
        }
        if (item.persona === 'player') {
            return this.persona.isPlayer(this.state);
        }
        if (item.persona === 'streamer') {
            return this.persona.isStreamer(this.state);
        }
        return true;
    }

    public enableDeveloper(): void {
        this.persona.setDeveloper(true);
        this.router.navigate(['/dashboard/developers']);
    }

    public logout(): void {
        this.authentication.logout();
        this.router.navigate(['/login']);
    }
}

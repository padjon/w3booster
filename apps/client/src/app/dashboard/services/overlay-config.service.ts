import { Injectable } from '@angular/core';

import { User } from 'app/data/models';
import { AuthenticationService } from 'app/data/services';
import { environment } from '@app/data/common-imports';

export interface OverlayToggle {
    key: string;
    label: string;
    pro?: boolean;
}

@Injectable()
export class OverlayConfigService {
    public readonly sharedToggles: OverlayToggle[] = [
        { key: 'topBarEnabled', label: 'Matchup bar' },
        { key: 'mapBarEnabled', label: 'Map bar' },
        { key: 'matchscoreEnabled', label: 'Match score' },
        { key: 'controlgroupsEnabled', label: 'Control groups' },
        { key: 'heroAbilitiesEnabled', label: 'Hero abilities', pro: true },
        { key: 'heroItemsEnabled', label: 'Hero items', pro: true },
        { key: 'heroExpProgressEnabled', label: 'Hero XP', pro: true },
        { key: 'heroLevelEnabled', label: 'Hero levels', pro: true },
        { key: 'researchesEnabled', label: 'Researches', pro: true }
    ];

    public readonly obsOnlyToggles: OverlayToggle[] = [
        { key: 'matchscoreEnabledInReplay', label: 'Match score in replay' },
        { key: 'showRacesOnlyTextual', label: 'Textual races' },
        { key: 'reversePlayerOrder', label: 'Reverse player order' }
    ];

    constructor(private authentication: AuthenticationService) {}

    public get user(): User {
        return this.authentication.getAuthenticatedUser();
    }

    public getOverlayUrl(): string {
        const user = this.user;
        if (!user) {
            return '';
        }
        if (!environment.production) {
            return 'http://localhost:8080/?channel=' + user.id + '&secret=' + user.broadcasterSecret;
        }
        return 'https://overlay.w3booster.com/?channel=' + user.id + '&secret=' + user.broadcasterSecret + '&no-cache=' + Math.random();
    }

    public toggle(target: 'player' | 'obs', key: string): void {
        const settings = target === 'player' ? this.user.playerOverlaySettings : this.user.obsOverlaySettings;
        settings[key] = !settings[key];
        settings.save();
    }

    public save(target: 'player' | 'obs'): void {
        const settings = target === 'player' ? this.user.playerOverlaySettings : this.user.obsOverlaySettings;
        settings.save();
    }
}

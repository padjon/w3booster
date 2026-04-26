import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

import { AuthenticationService } from 'app/data/services';

export type Persona = 'player' | 'streamer' | 'both';
export type PersonaFocus = 'player' | 'streamer';

export interface PersonaState {
    persona: Persona | null;
    developer: boolean;
    activeFocus?: PersonaFocus;
}

@Injectable()
export class PersonaService {
    private readonly personaKey = 'w3b.persona.value';
    private readonly developerKey = 'w3b.persona.developer';
    private readonly focusKey = 'w3b.persona.focus';
    private readonly userSettingsKey = 'uiPersona';
    private readonly developerSettingsKey = 'developer';

    private stateSubject = new BehaviorSubject<PersonaState>(this.readInitialState());

    public state$: Observable<PersonaState> = this.stateSubject.asObservable();

    constructor(private authentication: AuthenticationService) {}

    public get state(): PersonaState {
        return this.stateSubject.value;
    }

    public isPlayer(state = this.state): boolean {
        return state.persona === 'player' || state.persona === 'both';
    }

    public isStreamer(state = this.state): boolean {
        return state.persona === 'streamer' || state.persona === 'both';
    }

    public isDev(state = this.state): boolean {
        return state.developer === true;
    }

    public setPersona(persona: Persona): void {
        const next: PersonaState = {
            ...this.state,
            persona,
            activeFocus: persona === 'both' ? (this.state.activeFocus || 'player') : undefined
        };
        this.persist(next);
    }

    public setDeveloper(developer: boolean): void {
        this.persist({ ...this.state, developer });
    }

    public setActiveFocus(activeFocus: PersonaFocus): void {
        if (this.state.persona !== 'both') {
            return;
        }
        this.persist({ ...this.state, activeFocus });
    }

    public dashboardHome(state = this.state): string {
        if (state.persona === 'streamer') {
            return '/dashboard/stream';
        }
        if (state.persona === 'both' && state.activeFocus === 'streamer') {
            return '/dashboard/stream';
        }
        return '/dashboard/practice';
    }

    private readInitialState(): PersonaState {
        const settings = this.readSettings();
        const settingsPersona = this.normalizePersona(settings[this.userSettingsKey]);
        const localPersona = this.normalizePersona(localStorage.getItem(this.personaKey));
        const localFocus = this.normalizeFocus(localStorage.getItem(this.focusKey));
        const developerSetting = settings[this.developerSettingsKey];
        const localDeveloper = localStorage.getItem(this.developerKey);

        return {
            persona: settingsPersona || localPersona,
            developer: developerSetting !== undefined
                ? developerSetting === true
                : localDeveloper === 'true',
            activeFocus: localFocus || 'player'
        };
    }

    private persist(state: PersonaState): void {
        localStorage.setItem(this.personaKey, state.persona || '');
        localStorage.setItem(this.developerKey, String(state.developer));
        if (state.activeFocus) {
            localStorage.setItem(this.focusKey, state.activeFocus);
        }

        const user = this.authentication.getAuthenticatedUser();
        if (user) {
            if (!user.settings) {
                user['_settings'] = {};
            }
            user.settings[this.userSettingsKey] = state.persona;
            user.settings[this.developerSettingsKey] = state.developer;
            user.save();
        }

        this.stateSubject.next(state);
    }

    private readSettings(): { [index: string]: any } {
        const user = this.authentication.getAuthenticatedUser();
        return user && user.settings ? user.settings : {};
    }

    private normalizePersona(value: any): Persona | null {
        return value === 'player' || value === 'streamer' || value === 'both' ? value : null;
    }

    private normalizeFocus(value: any): PersonaFocus | null {
        return value === 'player' || value === 'streamer' ? value : null;
    }
}

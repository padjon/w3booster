import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

import { AuthenticationService } from 'app/data/services';

export type Persona = 'player' | 'streamer';
export type PersonaChoice = Persona;

export interface PersonaState {
    persona: PersonaChoice | null;
    developer: boolean;
}

@Injectable()
export class PersonaService {
    private readonly personaKey = 'w3b.persona.value';
    private readonly developerKey = 'w3b.persona.developer';
    private readonly userSettingsKey = 'uiPersona';
    private readonly developerSettingsKey = 'developer';

    private stateSubject = new BehaviorSubject<PersonaState>(this.readInitialState());

    public state$: Observable<PersonaState> = this.stateSubject.asObservable();

    constructor(private authentication: AuthenticationService) {}

    public get state(): PersonaState {
        return this.stateSubject.value;
    }

    public isPlayer(state = this.state): boolean {
        return state.persona === 'player';
    }

    public isStreamer(state = this.state): boolean {
        return state.persona === 'streamer';
    }

    public isDev(state = this.state): boolean {
        return state.developer === true;
    }

    public setPersona(persona: PersonaChoice): void {
        const next: PersonaState = {
            ...this.state,
            persona
        };
        this.persist(next);
    }

    public setDeveloper(developer: boolean): void {
        this.persist({ ...this.state, developer });
    }

    public dashboardHome(state = this.state): string {
        if (state.persona === 'streamer') {
            return '/dashboard/stream';
        }
        return '/dashboard/practice';
    }

    private readInitialState(): PersonaState {
        const settings = this.readSettings();
        const settingsPersona = this.normalizePersona(settings[this.userSettingsKey]);
        const localPersona = this.normalizePersona(localStorage.getItem(this.personaKey));
        const developerSetting = settings[this.developerSettingsKey];
        const localDeveloper = localStorage.getItem(this.developerKey);

        return {
            persona: settingsPersona || localPersona,
            developer: developerSetting !== undefined
                ? developerSetting === true
                : localDeveloper === 'true'
        };
    }

    private persist(state: PersonaState): void {
        localStorage.setItem(this.personaKey, state.persona || '');
        localStorage.setItem(this.developerKey, String(state.developer));

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

    private normalizePersona(value: any): PersonaChoice | null {
        if (value === 'player' || value === 'streamer') {
            return value;
        }
        if (value === 'both') {
            return localStorage.getItem('w3b.persona.focus') === 'streamer' ? 'streamer' : 'player';
        }
        return null;
    }
}

import { Component, Input } from '@angular/core';

import { Persona, PersonaService, PersonaState } from '../../services/persona.service';

@Component({
    selector: 'app-persona-picker',
    templateUrl: './persona-picker.component.html',
    styleUrls: ['./persona-picker.component.css']
})
export class PersonaPickerComponent {
    @Input() public state: PersonaState;

    public options: Array<{ persona: Persona; title: string; body: string; icon: string }> = [
        { persona: 'player', title: 'Player', body: 'Practice builds, review replays, and track improvement.', icon: 'fa fa-crosshairs' },
        { persona: 'streamer', title: 'Streamer', body: 'Manage overlays, automation, and viewer-facing moments.', icon: 'fa fa-broadcast-tower' },
        { persona: 'both', title: 'Both', body: 'Show both rails and switch focus from the shell.', icon: 'fa fa-random' }
    ];

    constructor(private personaService: PersonaService) {}

    public choose(persona: Persona): void {
        this.personaService.setPersona(persona);
    }
}

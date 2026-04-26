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
        { persona: 'player', title: 'Player', body: 'Practice builds, review replays, and track improvement tools.', icon: 'fa fa-crosshairs' },
        { persona: 'streamer', title: 'Streamer', body: 'Manage OBS overlays, automation, and viewer-facing tools.', icon: 'fa fa-broadcast-tower' }
    ];

    constructor(private personaService: PersonaService) {}

    public choose(persona: Persona): void {
        this.personaService.setPersona(persona);
    }
}

import { Component, Input } from '@angular/core';

import { PersonaFocus, PersonaService, PersonaState } from '../../services/persona.service';

@Component({
    selector: 'app-persona-toggle',
    templateUrl: './persona-toggle.component.html',
    styleUrls: ['./persona-toggle.component.css']
})
export class PersonaToggleComponent {
    @Input() public state: PersonaState;

    constructor(private persona: PersonaService) {}

    public setFocus(focus: PersonaFocus): void {
        this.persona.setActiveFocus(focus);
    }
}

import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-recorder-status-chip',
    templateUrl: './recorder-status-chip.component.html',
    styleUrls: ['./recorder-status-chip.component.css']
})
export class RecorderStatusChipComponent {
    @Input() public desktop = false;
}

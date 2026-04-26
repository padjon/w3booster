
import { Component, Input } from '@angular/core';
import { BaseComponent } from 'app/base.component';
import { ISettingsState, IGameState, IMiscState, EGameModeEnum } from 'app/data/models';

@Component({
    selector: 'app-mapbar',
    templateUrl: './mapbar.component.html',
    styleUrls: ['./mapbar.component.scss']
})
export class MapbarComponent extends BaseComponent {
    @Input() misc: IMiscState;
    @Input() settings: ISettingsState;
    @Input() game: IGameState;

    public showObserverBar() {
        if (this.game) {
            return (this.game.isReplay || this.game.isObserver) && this.game.gameMode === EGameModeEnum.GM_1V1;
        }
        return false;
    }
}

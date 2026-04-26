import { Component, Input } from '@angular/core';
import { MatchbarComponent } from 'app/matchbar/matchbar.component';
import { EResource, IHeroState, IPlayer, IPlayerResources, IPlayerStateHeroes, IPlayerStateResources, w3Collection } from 'app/data/models';

@Component({
    selector: 'app-obs-matchbar-4v4',
    templateUrl: './obs-matchbar-4v4.component.html',
    styleUrls: ['./obs-matchbar-4v4.component.scss']
})
export class ObsMatchbar4v4Component extends MatchbarComponent {
    public EResource = EResource;
    public _resources: IPlayerStateResources;
    public _heroes: IPlayerStateHeroes;

    @Input() set resources(resources: IPlayerStateResources) {
        this._resources = resources;
    }

    get resources() {
        return this._resources;
    }

    @Input() set heroes(heroes: IPlayerStateHeroes) {
        this._heroes = heroes;
    }

    get heroes() {
        return this._heroes;
    }

    public getPlayerResources(player: IPlayer): IPlayerResources {
        return this.resources && this.resources[player.id] ? this.resources[player.id] : {};
    }

    public getPlayerHeroes(player: IPlayer): IHeroState[] {
        if (!this.heroes || !this.heroes[player.id]) {
            return [];
        }

        return Object.values(this.heroes[player.id]).slice(0, 3);
    }

    public getHeroLevel(hero: IHeroState) {
        const result = Math.sqrt(0.02 * hero.experience + 2.25) - 0.5;
        return this.toFixed(result, result >= 10 ? 0 : 1);
    }

    public getHeroIconPath(hero: IHeroState) {
        const assetBasePath = this.game && this.game.isReforged === true ? 'assets/reforged/' : 'assets/classic/';
        if (w3Collection[hero.name] === undefined) {
            return null;
        }

        return assetBasePath + 'img/icons/' + w3Collection[hero.name].icon;
    }
}

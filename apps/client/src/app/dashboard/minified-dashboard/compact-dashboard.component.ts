import { View } from '@app/views/view';
import { Component, Injector, Host } from '@angular/core';
import { DashboardComponent } from '../dashboard';
import { NodeService } from '@app/data/services';

@Component({
    selector: 'app-compact-dashboard',
    templateUrl: './compact-dashboard.component.html',
    styleUrls: ['./compact-dashboard.component.css']
})
export class CompactDashboardComponent extends View {

    public p: DashboardComponent;
    public fontSize = 12;
    public decodeURIComponent = decodeURIComponent;
    public stateKeeper = null;

    constructor(private node: NodeService, protected injector: Injector, @Host() parent: DashboardComponent) {
        super(injector);

        this.p = parent;
        if (window && (window as any).process) {
            const mainWin = this.node.remote.getCurrentWindow() as any;
            mainWin.stateKeeper.saveState();
            mainWin.stateKeeper.unmanage();

            if (!this.stateKeeper) {
                this.stateKeeper = mainWin.stateKeeperPrototype({
                    file: 'compact-window-state.json',
                    defaultWidth: 500,
                    defaultHeight: 300
                });
            }
            console.log(this.stateKeeper);
            mainWin.setResizable(true);
            mainWin.setMinimumSize(340, 200);
            mainWin.setSize(this.stateKeeper.width, this.stateKeeper.height);
            if (this.stateKeeper.x && this.stateKeeper.y) {
                mainWin.setPosition(this.stateKeeper.x, this.stateKeeper.y);
            }

            this.stateKeeper.manage(mainWin);
        }
    }

    public switchToNormalDashboard() {
        if (this.node.isAvailable()) {
            const mainWin = this.node.remote.getCurrentWindow() as any;
            this.stateKeeper.saveState();
            this.stateKeeper.unmanage();
            if (mainWin.stateKeeper.x && mainWin.stateKeeper.y) {
                mainWin.setPosition(mainWin.stateKeeper.x, mainWin.stateKeeper.y);
            }
            mainWin.stateKeeper.manage(mainWin);
            mainWin.setFullScreen(false);
            mainWin.setSize(1280, 800);
            mainWin.setMaximumSize(1280, 800);
            mainWin.setMinimumSize(1280, 800);

            // bug in electron 15
            //mainWin.setResizable(false);

            this.p.toggleDashboardMode();
        }

    }


    public closeWindow() {
        if (this.node.isAvailable()) {
            this.node.remote.getCurrentWindow().close();
        }
    }

    public minimizeWindow() {
        if (this.node.isAvailable()) {
            this.node.remote.getCurrentWindow().minimize();
        }
    }

    public toggleWindowMaximize() {
        if (this.node.isAvailable()) {
            const wnd = this.node.remote.getCurrentWindow();
            if (wnd.isMaximized()) {
                wnd.unmaximize();
            } else {
                wnd.maximize();
            }

        }
    }

    public changeFont(increase: boolean) {
        this.fontSize = (increase ? Math.min(this.fontSize + 1, 20) : Math.max(this.fontSize - 1, 10));
    }


    public getColorCode(colorId: number) {
        console.log(colorId);
        switch (colorId) {
            case 0: return '#ff0303';
            case 1: return '#0042ff';
            case 2: return '#1ce6b9';
            case 3: return '#540081';
            case 4: return '#fffc00';
            case 5: return '#fe8a0e';
            case 6: return '#20c000';
            case 7: return '#e55bb0';
            case 8: return '#959697';
            case 9: return '#7ebff1';
            case 10: return '#106246';
            case 11: return '#4e2a04';
            case 12: return '#9b0000';
            case 13: return '#0000c3';
            case 14: return '#00eaff';
            case 15: return '#be00fe';
            case 16: return '#ebcd87';
            case 17: return '#f8a48b';
            case 18: return '#bfff80';
            case 19: return '#dcb9eb';
            case 20: return '#282828';
            case 21: return '#ebf0ff';
            case 22: return '#00781e';
            case 23: return '#a46f33';
        }
    }


    public getRaceColor(race: string) {
        switch (race.charCodeAt(0)) {
            case 'H'.charCodeAt(0): return '#4683c2';
            case 'O'.charCodeAt(0): return '#cc6556';
            case 'U'.charCodeAt(0): return '#7b64b4';
            case 'N'.charCodeAt(0): return '#45c092';
            default: return '#aaa';
        }
    }


}

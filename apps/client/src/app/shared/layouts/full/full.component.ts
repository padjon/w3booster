import { AuthenticationService, NodeService } from 'app/data/services';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '@app/data/common-imports';

@Component({
    selector: 'app-full-layout',
    templateUrl: './full.component.html',
    styleUrls: ['./full.component.scss']
})
export class FullComponent implements OnInit {
    public version = environment.version;
    public desktop = false;

    constructor(private node: NodeService, public router: Router, private authenticationService: AuthenticationService) { }

    ngOnInit() {
        this.desktop = this.node.isAvailable();
        if (this.router.url === '/') {
            this.router.navigate(['/dashboard']);
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

    public logout() {
        this.authenticationService.logout();
        this.router.navigate(['/login']);
    }
}

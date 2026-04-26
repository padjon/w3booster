import { Component } from '@angular/core';
import { environment } from '@app/data/common-imports';
import { NodeService } from '@app/data/services';

@Component({
  selector: 'app-blank-layout',
  templateUrl: './blank.component.html',
  styleUrls: []
})
export class BlankComponent {
  public version = environment.version;

  constructor(private node: NodeService) {

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
}

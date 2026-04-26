import { ViewChildren, QueryList, ElementRef } from '@angular/core';
import { hoverService } from './services/hover.service';

export class BaseComponent {

    public onMouseMoveHoverFix(target: any) {
        hoverService.elementWasSeen(target);
    }

    public toFixed(num, fixed) {
        num = String(num);
        if (num.indexOf('.') < 0) {
            num += '.000000';
        }
        const re = new RegExp('^-?\\d+(?:\.\\d{0,' + (fixed || -1) + '})?');
        return num.toString().match(re)[0];
    }
}

import { ElementRef } from '@angular/core';

class HoverService {
    public nativeElements = new Set<any>();
    public initialized = false;

    public elementWasSeen(nativeElement: any) {
        if (!this.initialized) {
            this.init();
        }
        this.nativeElements.add(nativeElement);
    }

    private init() {
        window.addEventListener('mousemove', (e) => {
            for (const nativeElement of this.nativeElements) {
                const bb: DOMRect = nativeElement.getBoundingClientRect();
                const x = e.clientX;
                const y = e.clientY;
                const isHover = x >= bb.x && x <= bb.x + bb.width && y >= bb.y && y <= bb.y + bb.height;
                const wasHover = nativeElement.classList.contains('hover');
                if (!(isHover === wasHover)) {
                    if (!isHover) {
                        nativeElement.classList.remove('hover');
                    } else {
                        nativeElement.classList.add('hover');
                    }
                }

                if (isHover) {
                    e.stopPropagation();
                    e.preventDefault();
                    break;
                } else {
                    this.nativeElements.delete(nativeElement);
                }
            }
        }, true);
        this.initialized = true;
    }
}

export const hoverService = new HoverService();

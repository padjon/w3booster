import { Injectable } from '@angular/core';
import { NodeService } from './node.service';

@Injectable()
export class IngameOverlayService {
    private user32 = null;
    private shcore = null;



    public isIngameOverlay(): boolean {
        const url = new URL(window.location.href);
        const w3hwnd = url.searchParams.get('w3hwnd');
        console.warn((window && (window as any).process && !!(w3hwnd)));
        return (window && (window as any).process && !!(w3hwnd));
    }

    public initialize() {
        const url = new URL(window.location.href);
        const w3hwnd = url.searchParams.get('w3hwnd');

        if (this.isIngameOverlay()) {
            const node = new NodeService();
            const webFrame = node.electron.webFrame;
            this.user32 = node.ffi.Library('user32.dll', {
                GetClientRect: ['bool', ['long', 'pointer']],
                SetWindowPos: ['bool', ['long', 'long', 'long', 'long', 'long', 'long', 'long']],
                MonitorFromWindow: ['long', ['long', 'long']], // HMONITOR MonitorFromWindow( HWND  hwnd, DWORD dwFlags);
            });


            this.shcore = node.ffi.Library('Shcore.dll', {
                GetDpiForMonitor: ['long', ['long', 'long', 'pointer', 'pointer']], // HRESULT GetDpiForMonitor(HMONITOR hmonitor,MONITOR_DPI_TYPE dpiType,UINT *dpiX,UINT *dpiY);
                GetScaleFactorForMonitor: ['long', ['long', 'pointer']]
            });

            const overlayWindow = node.remote.getCurrentWindow();
            const hwnd = node.ref.types.int64.get(overlayWindow.getNativeWindowHandle(), 0);

            const rect = node.refStruct({
                left: 'long',
                top: 'long',
                right: 'long',
                bottom: 'long',
            });

            let height = 0;
            let width = 0;
            const intervalWindowUpdate = () => {
                const clientRect = new rect();
                this.user32.GetClientRect(w3hwnd, clientRect['ref.buffer']);
                if (height !== clientRect.bottom || width !== clientRect.right) {
                    console.log(clientRect.right)
                    height = clientRect.bottom;
                    width = clientRect.right;
                    // const ratio = clientRect.right / clientRect.bottom;
                    let windowsZoom = 1.0;
                    const hmonitor = this.user32.MonitorFromWindow(w3hwnd, 0x00000002);
                    if (hmonitor) {
                        const scaleBuffer = Buffer.alloc(4);
                        if (this.shcore.GetScaleFactorForMonitor(hmonitor, scaleBuffer) === 0) {
                            windowsZoom = scaleBuffer.readUInt32LE(0) /100.0;
                            webFrame.setZoomFactor(windowsZoom);
                        }
                    }
                    

                    // set window
                    const scaledWindowWidth = Math.trunc(width / windowsZoom);                    
                    const scaledWindowHeight = Math.trunc(height / windowsZoom);
                    overlayWindow.setSize(scaledWindowWidth, scaledWindowHeight);
                    this.user32.SetWindowPos(hwnd, 0, 0, 0, 0, 0, 0x0005);
                }
            };

            setInterval(intervalWindowUpdate.bind(this), 1000);
            setTimeout(() => {
                intervalWindowUpdate();
                height = 0;
            }, 300);
        }
    }
}

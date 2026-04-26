import { Injectable } from "@angular/core";
import * as origfs from 'fs'

//@ts-nocheck
//import * as fs from "@types/node"
@Injectable()
export class StreamlabsService {

    private isConnected = false;
    constructor() {
        if((window as any).process) {
            import('fs').then((fs)=>{
                (origfs as any) = (window as any).require('fs');
                console.warn(require('fs'));
                console.warn("FSSSSSSS")
                console.warn(fs.ReadStream);
            });
        //(fs as any) = require('fs');
    }


        //asd
        /*
        if((window as any).process)
        import('fs').then(() =>{

        })*/
        //fs.readFileSync("test");
        
        //const net = (<any>window).require('net') as Node.net;
        
        const pipeBasePath = '\\\\.\\pipe\\';
        const pipeName = pipeBasePath + "xxx";
        /*
        var setInterval(() => {

        })*/
    }

    public get fs() {
        (origfs as any) = (window as any).require('fs');
        return origfs;
    }


    public isAvailable(): boolean {
        return this.isConnected;
    }
}
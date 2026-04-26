import { Injectable } from '@angular/core';
import type * as __fs from 'fs';
import type * as __os from 'os';
import type * as __process from 'process';
import type * as __electron from 'electron';
import type * as __net from 'net';
import type * as __path from 'path';
import type * as __ffi from 'ffi';
import type * as __refStruct from 'ref-struct';
import type * as __ref from 'ref';
import type * as __http from 'http';
import type * as __remote from '@electron/remote';
import type * as __child_process from 'child_process'
import type * as __WebSocket from 'ws';

@Injectable()
export class NodeService {

    private _http: typeof __http;
    private _fs: typeof __fs;
    private _os: typeof __os;
    private _process: typeof __process;
    private _electron: typeof __electron;
    private _electronIpcRenderer: Electron.IpcRenderer;
    private _remote: typeof __remote;
    private _net: typeof __net;
    private _path: typeof __path;
    private _ffi: typeof __ffi;
    private _refStruct: typeof __refStruct.default;
    private _ref: typeof __ref;
    private _child_process: typeof __child_process;
    private _webSocket: typeof __WebSocket;

    private requirePrefix;

    public constructor() {
        if (!this.isAvailable()) {
            return;
        }

        if (this.process.execPath.indexOf('node_modules') >= 0) {
            this.requirePrefix = this.process.execPath.split('node_modules')[0] + 'node_modules\\';
        } else {
            this.requirePrefix = this.path.dirname(this.process.execPath) + '\\resources\\app\\node_modules\\';
        }
    }

    public isAvailable() {
        return (window && (window as any).process !== undefined);
    }


    public get electron() {
        this._electron ??= this.require('electron');
        return this._electron;
    }

    public get http() {
        this._http ??= this.require('http');
        return this._http;
    }

    public get fs() {
        this._fs ??= this.require('fs');
        return this._fs
    }

    public get os() {
            this._os ??= this.require('os');
            return this._os
    }

    public get process() {
        this._process ??= this.require('process');
        return this._process
    }

    public get ipcRenderer() {
        if (!this._electronIpcRenderer) {
            const { ipcRenderer } = this.require('electron');
            this._electronIpcRenderer = ipcRenderer;
        }
        return this._electronIpcRenderer;
    }

    public get remote() {
        this._remote ??= this.requireNonNativePkg('@electron/remote');
        return this._remote
    }

    public get net() {
        this._net ??= this.require('net');
        return this._net
    }

    public get path() {
        this._path ??= this.require('path');
        return this._path;
    }

    public get ffi() {
        this._ffi ??= this.requireNonNativePkg('ffi-napi');
        return this._ffi;
    }

    public get refStruct() {
        this._refStruct ??= this.requireNonNativePkg('ref-struct-napi');
        return this._refStruct;
    }

    public get ref() {
        this._ref ??= this.requireNonNativePkg('ref-napi');
        return this._ref;
    }

    public get WebSocket() {
        this._webSocket ??= this.requireNonNativePkg('ws');
        return this._webSocket;
    }

    public get child_process() {
            this._child_process ??= this.require('child_process');
        return this._child_process;
    }

    private require(pkg: string): any {
        return (window as any).require(pkg);
    }

    private requireNonNativePkg(pkg: string): any {
        return (window as any).require(this.requirePrefix + pkg);
    }
}



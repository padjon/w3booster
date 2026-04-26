import { Express } from 'express';
import { BaseAPI } from './base/base.api';
import { hashElement } from 'folder-hash';
import { watch } from 'chokidar';

export class PatchAPI extends BaseAPI {

    readonly patchPath = __dirname + '/../public/patch/';
    private folderHashes = {} as any;
    private version = '';
    private hashes = [];
    private;

    constructor(app: Express) {
        super(app);

        this.init().then(() => {
            this.getRouter().get('/hash', (req, res, next) => {
                res.send(this.version);
            });

            this.getRouter().get('/hashes', (req, res, next) => {
                res.send(this.hashes);
            });
        });

        (watch(this.patchPath, {ignoreInitial: true}) as any).on('all', (event, path) => {
            console.log('Patch change detected. Recauculating hashes');
            this.init();
        });
    }

    private init() {
        return new Promise<void>(res => {
            hashElement(this.patchPath, {
                files: {
                    ignoreBasename: true,
                    ignoreRootName: true
                },
            }).then(hashes => {
                this.folderHashes = JSON.parse(JSON.stringify(hashes));
                this.folderHashes.name = '';
                this.version = this.folderHashes.hash;
                this.hashes = this.getHashes(this.folderHashes);
                res();
            });
        });
    }

    private getHashes(hashObject, basePath = ''): Array<any> {
        let result = [];
        if (hashObject.children) {
            basePath += (hashObject.name != '') ? hashObject.name + '/' : '';
            for (const child of hashObject.children) {
                result = result.concat(this.getHashes(child, basePath));
            }
        } else {
            const filePath = basePath + hashObject.name;
            result = [{ hash: hashObject.hash, path: filePath }];
        }
        return result;
    }
}

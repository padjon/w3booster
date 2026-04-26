import { BroadcastingServiceInterface, Scene } from './broadcasting-service.interface';
import { Injectable } from '@angular/core';
import { NodeService } from '../node.service';
import { Socket } from 'net';
import { EventEmitter } from 'events';
import { EEventsystemConfigTarget } from '@app/data/common/models';


@Injectable()
export class StreamlabsService extends BroadcastingServiceInterface {
    readonly pipePath = '\\\\.\\pipe\\slobs';
    private client: Socket = undefined;
    private nextId = 0;

    private msgEmitter = new EventEmitter();

    constructor(private node: NodeService) {
        super(EEventsystemConfigTarget.STREAMLABS);
        this.initialize();
    }

    public fetchSources() {
        return new Promise<Array<Scene>>((resolve, reject) => {
            const id = String(++this.nextId);

            this.msgEmitter.once(id, (result) => {
                resolve(result);
            });

            this.send({
                'jsonrpc': '2.0',
                'id': id,
                'method': 'getScenes',
                'params': {
                    'resource': 'ScenesService'
                }
            });
        });


    }

    protected becameAvailable() {
        console.warn('BECAME AVAILABLE');

        this.client = this.node.net.connect(this.pipePath, () => {
            console.warn('Client: on connection');
            super.becameAvailable();
        });

        this.client.on('data', (data) => {
            console.warn('Client: on data:', String.fromCharCode.apply(null, data));
            console.warn(JSON.parse(String.fromCharCode.apply(null, data)));
            const result = JSON.parse(String.fromCharCode.apply(null, data));
            this.msgEmitter.emit(String(result.id), result.result);
        });

        this.client.on('end', function () {
            this.becameUnavailable();
        });

    }

    protected becameUnavailable() {
        delete this.client;
        super.becameUnavailable();
        if (this.node.isAvailable()) {
            const interval = setInterval(() => {
                const available = this.node.fs.existsSync(this.pipePath);
                if (this.isAvailable() !== available) {
                    if (available) {
                        clearInterval(interval);
                        this.becameAvailable();
                    } else {
                        this.becameUnavailable();
                    }
                }
            }, 1000);
        }
    }

    protected toggleSource(sceneId: string, sourceId: string, visible: boolean) {
        const id = String(++this.nextId);

        this.msgEmitter.once(id, (result) => {
            if (result && result.resourceId) {
                this.send({
                    'jsonrpc': '2.0',
                    'id': String(++this.nextId),
                    'method': 'setVisibility',
                    'params': {
                        'resource': result.resourceId,
                        'args': [visible as any]
                    }
                });
            }
        });

        this.send({
            'jsonrpc': '2.0',
            'id': id,
            'method': 'getItem',
            'params': {
                'resource': 'Scene["' + sceneId + '"]',
                'args': [sourceId]
            }
        });
    }

    protected switchToScene(sceneId: string) {
        this.send({
            'jsonrpc': '2.0',
            'id': String(++this.nextId),
            'method': 'makeActive',
            'params': {
                'resource': 'Scene["' + sceneId + '"]',
                'args': []
            }
        });
    }

    private send(jsonData) {
        const data = JSON.stringify(jsonData) + '\n';
        console.warn('Sending data:');
        console.warn(data);
        this.client.write(data);
    }
}

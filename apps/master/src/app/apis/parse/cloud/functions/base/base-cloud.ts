import { ParseService, ServiceManager } from 'app/data/services';

export class BaseCloud {
    private classname;
    constructor(classname: string) {
        this.classname = classname;
    }

    public static register<T extends BaseCloud>(cloudClass: new () => T) {
        new cloudClass();
    }

    protected registerMethod(methodname: string, method) {
        Parse.Cloud.define(this.classname + '_' + methodname, (request) => {
            const args = (request.params) ? Object.values(request.params) : [];
            return method.bind(this)(ServiceManager.get(ParseService).patchSubclass(request.user), ...args);
        });
    }
}

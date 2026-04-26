import { BaseModelService } from '../../common/modelservices/base/base-modelservice';
import { ParseService, ErrorService } from '../../common/services';

export class ServiceManager {
    private static objectMap = ServiceManager.init();

    private static init(): Map<string, Object> {
        const objectMap = new Map<string, Object>();
        return objectMap;
    }

    public static get<T>(plainCtor: new (...args: any[]) => T): T {
        const ctor: any = plainCtor;
        let result = ServiceManager.objectMap.get(ctor.name) as T;
        if (!result) {
            if (ctor == ParseService) {
                result = new ctor(this.get<ErrorService>(ErrorService));
            } else if (ctor.prototype instanceof BaseModelService) {
                result = new ctor(this.get<ErrorService>(ErrorService), this.get<ParseService>(ParseService));
            } else {
                result = new ctor();
            }
            ServiceManager.objectMap.set(ctor.name, result);
        }
        return result as T;
    }
}
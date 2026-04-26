import { BaseModelService } from 'app/data/common/modelservices/base/base-modelservice';
import { ErrorService, ParseService, ServiceManager } from 'app/data/services';

export abstract class TriggerHandler<T extends Parse.Object, A extends BaseModelService<T>> {


    public static register<T extends TriggerHandler<Parse.Object, BaseModelService<Parse.Object>>>(handlerConstructor: new () => T) {
        new handlerConstructor();
    }

    public constructor(modelConstructor: new () => T, serviceConstructor: new (errorService: ErrorService, parseService: ParseService) => A) {
        if (this.beforeCreate || this.beforeUpdate) {
            Parse.Cloud.beforeSave(modelConstructor, (request) => {

                let result = true;

                const entity = request.object as T;
                (entity as any)._setExisted(false);

                const isCreate = !((request as any).original);
                if (isCreate && this.beforeCreate) {
                    result = !(this.beforeCreate(entity) === false);
                } else if (!isCreate && this.beforeUpdate) {
                    result = !(this.beforeUpdate(entity) === false);
                }

                if (result) {
                    return;
                } else {
                    throw Parse.Error.INTERNAL_SERVER_ERROR;
                }
            });
        }

        if (this.afterCreate || this.afterUpdate) {
            Parse.Cloud.afterSave(modelConstructor, (request) => {
                const isCreate = !((request as any).original);
                ServiceManager.get(serviceConstructor).getById(request.object.id).then((entity) => {
                    if (isCreate && this.afterCreate) {
                        this.afterCreate(entity);
                    } else if (!isCreate && this.afterUpdate) {
                        this.afterUpdate(entity, ServiceManager.get(ParseService).patchSubclass(request.original) as any);
                    }
                });
            });
        }
    }

    protected beforeCreate?(object: T): boolean | void;
    protected beforeUpdate?(object: T): boolean | void;

    protected afterCreate?(object: T): void;
    protected afterUpdate?(object: T, objectBefore: T): void;
}
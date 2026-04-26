import { ParseService, Parse } from '../../services/parse.service';
export { Parse };

export interface IPointer {
  __type: string;
  className: string;
  objectId: string;
}

export class BaseModel extends Parse.Object {
  public static registerClass(classObject: any, className: string) {
    Parse.Object.registerSubclass(className, classObject);
  }

  public static save<T extends Parse.Object>(object: T, saveCallback: (attrs?: { [key: string]: any } | null, options?: Parse.Object.SaveOptions) => Promise<T>): Promise<T> {
    object['_pendingInit'] = false;

    const ignoredAttrKeys = ['_objCount', '_sessionToken', '_pendingInit'];
    for (const attrKey of Object.keys(object)) {
      if (attrKey[0] === '_' && ignoredAttrKeys.indexOf(attrKey) < 0) {
        const value = object[attrKey];
        /*if (value instanceof Map) {
          value = { specialType: 'Map', object: Array.from(value) };
        }*/
        object.set(attrKey.substr(1), value);
      }
    }
    
    if (ParseService.isParseServer()) {
      return saveCallback.bind(object)(null, { useMasterKey: true });
    } else {
      return saveCallback.bind(object)();
    }
  }

  public static unset<T extends Parse.Object>(object: T, field: string, unsetCallback: (field: string) => void): void {
    delete object["_" + field];
    unsetCallback.bind(object)(field);
  }

  public static initParseObject<T extends Parse.Object>(object: T) {
    object['_pendingInit'] = true;
  }

  public static setExisted<T extends Parse.Object>(object: T, isExisted: boolean, existedCallback: (arg0: boolean) => void) {
    if (!object.existed()) {
      for (const attrKey of Object.keys(object)) {
        if (attrKey[0] === '_' && attrKey !== '_objCount' && attrKey !== '_id') {
          delete object[attrKey];
        }
      }
    }

    for (const attrKey of Object.keys(object.attributes)) {
      if (object[attrKey] === undefined || object['_pendingInit']) {
        const value = object.get(attrKey);
        /*if (value && value.specialType === 'Map') {
          value = new Map(value.object);
        }*/
        object['_' + attrKey] = value;
      }
    }
    object['_pendingInit'] = false;
    existedCallback.bind(object)(isExisted);
  }

  constructor(className: string) {
    super(className);
    if (className === '' || className === undefined) {
      console.warn('Constructor called without class name!');
    }
    BaseModel.initParseObject(this);
  }

  public unsetTypesafe(field: keyof this): any {
    return BaseModel.unset(this, field as string, super.unset);
  }

  public unset(field: string): any {
    return BaseModel.unset(this, field, super.unset);
  }

  public save(): Promise<this> {
    return BaseModel.save(this, super.save);
  }

  public getAsPointer(): IPointer {
    return { __type: 'Pointer', className: this.className, 'objectId': this.id };
  }

  protected initArray(obj: Array<any>) {
    return new Array();
  }

  private _setExisted(isExisted: boolean) {
    BaseModel.setExisted(this, isExisted, super['_setExisted']);
  }
}

import { ErrorService, ParseService, Parse } from '../../services';
import { PageInfo } from '../../models';

export type FilterCallback = (query: Parse.Query, filterString: string) => any;
export class BaseModelService<T extends Parse.Object> {

    constructor(protected errorService: ErrorService, protected parseService: ParseService, protected modelConstructor: new () => T) {
    }

    public static createQuery<T extends Parse.Object>(modelConstructor: new () => T, includes?: Array<keyof T>): Parse.Query<T> {
        const query = new Parse.Query<T>(modelConstructor);
        this.patchQuery(query);

        if (includes) {
            for (const include of includes) {
                query.include(include.toString());
            }
        }
        return query;
    }

    public static createOrQuery<T extends Parse.Object>(queries: Array<Parse.Query<T>>): Parse.Query<T> {
        return BaseModelService.patchQuery(Parse.Query.or(...queries));
    }

    private static patchQuery<T extends Parse.Object>(query: Parse.Query<T>) {
        if (ParseService.isParseServer()) {
            query['_find'] = query.find;
            query['_first'] = query.first;
            query.find = (options?: Parse.Query.FindOptions): Promise<T[]> => {
                options = options || {};
                if (options.useMasterKey === undefined) {
                    options.useMasterKey = true;
                }
                return query['_find'](options);
            };
            query.first = (options?: Parse.Query.FindOptions): Promise<T> => {
                options = options || {};
                if (options.useMasterKey === undefined) {
                    options.useMasterKey = true;
                }
                return query['_first'](options);
            };
        }
        return query;
    }


    public get(includes?: Array<keyof T>, limit?: number) {
        return new Promise<T[]>((resolve, reject) => {
            const query = this.createQuery(includes);
            if (limit) {
                query.limit(limit);
            }
            query.find().then(objectList => resolve(objectList), error => this.errorService.handleParseErrors(error));
        });
    }

    public getById(objectId: string, includes?: Array<keyof T>) {
        return this.getFirstByAttribute('objectId' as any, objectId, includes);
    }

    public getByAttribute(attribute: keyof T, value: any, includes?: Array<keyof T>) {
        return new Promise<T[]>((resolve, reject) => {
            const query = this.createQuery(includes);
            query.equalTo(attribute as string, value);
            query.limit(99999999);
            query.find().then(objectList => resolve(objectList), error => this.errorService.handleParseErrors(error));
        });
    }

    public getFirstByAttribute(attribute: keyof T | Array<keyof T>, value: any, includes?: Array<keyof T>) {
        return new Promise<T>((resolve, reject) => {
            if (Array.isArray(attribute)) {
                const queries = new Array<Parse.Query<T>>();
                for (const attr of attribute) {
                    const query = this.createQuery(includes);
                    query.equalTo(attr as string, value);
                    queries.push(query);
                }
                const query = this.createOrQuery(queries);
                query.first().then(object => resolve(object), error => this.errorService.handleParseErrors(error));
            } else {
                const query = this.createQuery(includes);
                query.equalTo(attribute as string, value);
                query.first().then(object => resolve(object), error => this.errorService.handleParseErrors(error));
            }
        });
    }

    public createOrQuery(queries: Array<Parse.Query<T>>): Parse.Query<T> {
        return BaseModelService.createOrQuery(queries);
    }

    public createQuery(includes?: Array<keyof T>): Parse.Query<T> {
        return BaseModelService.createQuery(this.modelConstructor, includes);
    }

    public runCloudMethod(name: string, args) {
        return Parse.Cloud.run(name.replace('.', '_'), args);
    }

    protected applyPageInfo(query: Parse.Query<T>, pageInfo: PageInfo, filterCallback?: FilterCallback): Parse.Query<T> {
        if (pageInfo.filterQuery && filterCallback) {
            query = this.applyFilter(query, pageInfo.filterQuery, filterCallback);
        }

        if (pageInfo) {
            query.count().then((count) => pageInfo.totalCount = count);
            query.limit(pageInfo.rowLimit);
            query.skip(pageInfo.pageOffset * pageInfo.rowLimit);
            if (pageInfo.orderAsc) {
                query.ascending(pageInfo.order);
            } else {
                query.descending(pageInfo.order);
            }
        }
        return query;
    }

    protected applyFilter(query: Parse.Query<T>, filterQuery: string, filterCallback: FilterCallback): Parse.Query<T> {
        return filterCallback(query, filterQuery);
    }
}

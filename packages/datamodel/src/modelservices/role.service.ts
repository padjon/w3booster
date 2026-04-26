
import { ErrorService, ParseService, Parse } from '../services';
import { Role, User } from '../models';
import { BaseModelService } from './base/base-modelservice';
import { Injectable } from '@angular/core'

@Injectable()
export class RoleService extends BaseModelService<Role> {

    constructor(errorService: ErrorService, parseService: ParseService) {
        super(errorService, parseService, Role);
    }

    public getUserRoles(user: User): Promise<Array<Role>> {
        return new Promise<Array<Role>>((resolve, reject) => {
            const defaultQuery = this.createQuery();
            defaultQuery.equalTo('name', 'default');
            const specificQuery = this.createQuery();
            specificQuery.equalTo('users', user);
            this.createOrQuery([defaultQuery, specificQuery]).find().then(roles => {
                this.addChildRoles(roles).then(allRoles => resolve(allRoles));
            }, error => reject(this.errorService.handleParseErrors(error)));
        });
    }

    private addChildRoles(roleArray: Array<Role>): Promise<Array<Role>> {
        return new Promise<Array<Role>>((resolve, reject) => {
            let resultRoles = roleArray;
            if (roleArray.length === 0) {
                resolve(roleArray);
            } else {
                roleArray.forEach((role) => {
                    role.roles.query().find().then((roles) => {
                        resultRoles = resultRoles.concat(roles as Array<Role>);
                        this.addChildRoles(roles as Array<Role>).then((additionalRoles) => {
                            resolve(resultRoles.concat(additionalRoles));
                        });
                    });
                });
            }
        });
    }
}

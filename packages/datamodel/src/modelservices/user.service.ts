import { ErrorService, ParseService, Parse, Subscription } from '../services';
import { User } from '../models';
import { BaseModelService } from './base/base-modelservice';
import { EEventsystemConfigTarget } from '../models/eventsystem-config';
import { Injectable } from '@angular/core'

@Injectable()
export class UserService extends BaseModelService<User> {

    constructor(errorService: ErrorService, parseService: ParseService) {
        super(errorService, parseService, User);
    }

    public getCurrentUser() {
        return this.getBySessionToken(Parse.User.current().getSessionToken());
    }

    public getByCloudRequest(request: Parse.Cloud.FunctionRequest) {
        if (request.user) {
            return this.getBySessionToken(request.user.getSessionToken());
        } else {
            return new Promise<User>((resolve) => resolve(null));
        }
    }

    public getBySessionToken(sessionToken: string) {
        return new Promise<User>((resolve, reject) => {
            const query = BaseModelService.createQuery<Parse.Session>(Parse.Session);
            query.equalTo('sessionToken', sessionToken);
            query.include('user');
            query.include('user.playerOverlaySettings');
            query.include('user.obsOverlaySettings');
            query.include('user.eventsystemConfigs.' + EEventsystemConfigTarget.OBS);
            query.include('user.eventsystemConfigs.' + EEventsystemConfigTarget.STREAMLABS);
            query.include('user.eventsystemConfigs.' + EEventsystemConfigTarget.XSPLIT);
            query.first().then(session => resolve(session.get('user')), error => this.errorService.handleParseErrors(error));
        });
    }

    public getByEmail(email: string): Promise<User> {
        return new Promise<User>((resolve, reject) => {
            const query = this.createQuery();
            query.equalTo('email', email);
            query.include('playerOverlaySettings');
            query.include('obsOverlaySettings');
            query.first().then(user => resolve(user), error => this.errorService.handleParseErrors(error));
        });
    }

    public subById(userId: string): Promise<Subscription<User>> {
        return new Promise<Subscription<User>>((resolve, reject) => {
            const query = this.createQuery();
            query.equalTo('objectId', userId);
            this.parseService.subscribe<User>(query).then(subscription => resolve(subscription));
        });
    }

    public connectDiscord(code: string): Promise<string> {
        return this.runCloudMethod('UserCloud.connectDiscord', [...Array.from(arguments)]);
    }

    public disconnectDiscord(): Promise<string> {
        return this.runCloudMethod('UserCloud.disconnectDiscord', [...Array.from(arguments)]);
    }
}

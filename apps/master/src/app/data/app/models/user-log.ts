import { BaseModel } from 'app/data/common/models/base';
import { User } from 'app/data/models';

export class UserLog extends BaseModel {
    public static PARSE_CLASSNAME = 'UserLog';
    private _user: User;
    private _logs: string;

    constructor() {
        super(UserLog.PARSE_CLASSNAME);
        this._logs = '';
    }


    /**
     * Getter user
     * @return {User}
     */
    public get user(): User {
        return this._user;
    }

    /**
     * Setter user
     * @param {User} value
     */
    public set user(value: User) {
        this._user = value;
    }


    public get logs(): string {
        return this._logs;
    }

    public set logs(value: string) {
        this._logs = value;
    }

}

BaseModel.registerClass(UserLog, UserLog.PARSE_CLASSNAME);

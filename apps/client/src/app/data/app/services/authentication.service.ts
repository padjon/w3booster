import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { RoleService } from 'app/data/modelservices';
import {
    User,
    EUserPlan,
    Role,
    RolePrivilegeEnum,
    RoleRestrictionEnum
} from 'app/data/models';
import { ParseService, Parse } from 'app/data/common/services/parse.service';
import { environment } from '@env/environment';

@Injectable()
export class AuthenticationService  {
    private mainRole: Role = null;
    private roles = new Set<Role>();
    private privileges = new Set<string>();
    private restrictions = new Set<string>();
    private isSU: boolean;
    private initialized = false;
    private e2eUser: User = null;

    constructor(
        private router: Router,
        private parseService: ParseService,
        private roleService: RoleService
    ) { }

    public initialize() {
        return new Promise<void>((resolve, reject) => {
            this.roles.clear();
            this.privileges.clear();
            this.restrictions.clear();
            this.isSU = false;
            this.mainRole = null;

            if (this.isE2EMode()) {
                this.initialized = true;
                resolve();
                return;
            }

            if (this.isAuthenticated()) {
                this.roleService
                    .getUserRoles(this.getAuthenticatedUser())
                    .then(roles => {
                        this.mainRole = roles.length > 0 ? roles[0] : null;
                        for (const role of roles) {
                            this.roles.add(role);
                            if (role.privileges) {
                                for (const privilege of role.privileges) {
                                    this.privileges.add(privilege);
                                }
                            }
                            if (role.restrictions) {
                                for (const restriction of role.restrictions) {
                                    this.restrictions.add(restriction);
                                }
                            }
                        }
                        this.isSU = this.hasPrivilege(RolePrivilegeEnum.su_any);
                        this.initialized = true;
                        resolve();
                    }).catch((err) => {
                        resolve();
                        this.router.navigate(['/login']);
                    });
            } else {
                this.initialized = true;
                resolve();
            }
        });
    }

    public isInitialized() {
        return this.initialized;
    }

    public canActivateChild(route: ActivatedRouteSnapshot): boolean {
        const requiresAuthentication: boolean = !(
            route.data.requiresAuthentication === false
        );
        if (requiresAuthentication && !this.isAuthenticated()) {
            this.router.navigate(['/login']);
            return false;
        }
        const requiresPrivilieges = route.data.requiresPrivileges;
        if (
            requiresPrivilieges !== undefined &&
            requiresPrivilieges instanceof Array
        ) {
            for (const requiredPrivilege of requiresPrivilieges) {
                if (!this.hasPrivilege(requiredPrivilege)) {
                    // this.toasterService.pop('error', 'Zugriff verweigert', 'Sie verfügen nicht über die notwendigen Rechte, um diese Inhalte aufzurufen.');
                    this.router.navigate(['/login']);
                    return false;
                }
            }
        }
        return true;
    }

    public login(username: string, password: string) {
        return new Promise<User>((resolve, reject) => {
            Parse.User.logIn(username, password, {
                success: () => {
                    this.initialize().then(() => {
                        if (this.privileges.size === 0) {
                            reject(new Error('You dont owe any roles'));
                        } else {
                            resolve(this.getAuthenticatedUser());
                        }
                    });
                },
                error: (_user: User, error: Error) => {
                    reject(error);
                }
            });
        });
    }

    public logout() {
        localStorage.removeItem('TWITCH_ACCESS_TOKEN');
        localStorage.removeItem('TWITCH_ID');
        localStorage.removeItem('BATTLENET_ACCESS_TOKEN');
        localStorage.removeItem('BATTLENET_ID');
        localStorage.removeItem('W3B_E2E_AUTH');
        this.e2eUser = null;
        Parse.User.logOut().then(() => this.initialize());
    }

    public resetPassword(username: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            Parse.Cloud.run(
                'resetUserPassword',
                { email: username },
                {
                    success: () => {
                        resolve();
                    },
                    error: (error: Parse.Error) => {
                        reject(error);
                    }
                }
            );
        });
    }

    public hasPrivilege(privilege: RolePrivilegeEnum): boolean {
        return this.isSU ? true : this.privileges.has(privilege);
    }

    public hasRestriction(restriction: RoleRestrictionEnum): boolean {
        return this.restrictions.has(restriction);
    }

    public getMainRole(): Role {
        return this.mainRole;
    }

    public getAuthenticatedUser(): User {
        if (this.isE2EMode()) {
            return this.getE2EUser();
        }
        return this.parseService.patchSubclass(Parse.User.current()) as User;
    }

    public isAuthenticated(): boolean {
        if (this.isE2EMode()) {
            return true;
        }
        return this.getAuthenticatedUser() !== null;
    }

    private isE2EMode(): boolean {
        if (environment.production || typeof window === 'undefined') {
            return false;
        }

        const host = window.location.hostname;
        const localHost = host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0';
        return localHost && localStorage.getItem('W3B_E2E_AUTH') === 'true';
    }

    private getE2EUser(): User {
        if (this.e2eUser) {
            return this.e2eUser;
        }

        const user = new User();
        user.id = 'e2e-user';
        user.username = 'e2e_user';
        user.displayName = 'E2E Tester';
        user.email = 'e2e@w3booster.local';
        user.broadcasterSecret = 'e2e-secret';
        user.connectedAccounts = [
            {
                provider: 'twitch',
                id: 'e2e-twitch',
                login: 'e2ecaster',
                displayName: 'E2E Caster',
                connectedAt: new Date().toISOString()
            },
            {
                provider: 'battlenet',
                id: 'e2e-bnet',
                login: 'E2E#1234',
                displayName: 'E2E#1234',
                connectedAt: new Date().toISOString()
            }
        ];
        user.plan = localStorage.getItem('W3B_E2E_PRO') === 'true' ? EUserPlan.PRO : EUserPlan.BASIC;
        user.planUntil = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
        const e2ePersona = localStorage.getItem('w3b.persona.value');
        if (e2ePersona) {
            user.settings['uiPersona'] = e2ePersona;
        }
        user.settings['developer'] = localStorage.getItem('w3b.persona.developer') !== 'false';

        user.save = (() => Promise.resolve(user)) as any;
        user.playerOverlaySettings.save = (() => Promise.resolve(user.playerOverlaySettings)) as any;
        user.obsOverlaySettings.save = (() => Promise.resolve(user.obsOverlaySettings)) as any;

        this.e2eUser = user;
        return user;
    }
}

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { ConnectedAccount, User } from 'app/data/models';
import { AuthenticationService } from 'app/data/services';
import {
    BuildOrder,
    BuildOrderPublisherIdentity,
    BuildOrderService,
    BuildOrderStep,
    PublicBuildOrder
} from '../../services/build-order.service';

@Component({
    selector: 'app-build-orders-page',
    templateUrl: './build-orders-page.component.html',
    styleUrls: ['../dashboard-page.css']
})
export class BuildOrdersPageComponent implements OnInit {
    public orders: BuildOrder[] = [];
    public publicOrders: PublicBuildOrder[] = [];
    public selectedId = '';
    public activeId = '';
    public shareCode = '';
    public importCode = '';
    public importError = '';
    public mode: 'select' | 'manage' = 'select';
    public raceFilter = 'all';
    public publisherIdentityId = '';
    public publishMessage = '';
    public user: User;

    constructor(
        public buildOrderService: BuildOrderService,
        private authentication: AuthenticationService,
        private route: ActivatedRoute,
        private router: Router
    ) {}

    public ngOnInit(): void {
        this.user = this.authentication.getAuthenticatedUser();
        this.mode = this.route.snapshot.data.mode === 'manage' ? 'manage' : 'select';
        const state = this.buildOrderService.load();
        this.orders = state.orders;
        this.selectedId = state.selectedId;
        this.activeId = state.activeId;
        this.publicOrders = this.buildOrderService.listPublicOrders(this.orders);
        this.publisherIdentityId = this.publisherIdentities[0]?.id || '';
        this.refreshShareCode();
    }

    public get selected(): BuildOrder {
        return this.orders.find(order => order.id === this.selectedId);
    }

    public create(): void {
        const order = this.buildOrderService.createOrder();
        this.orders.unshift(order);
        this.selectedId = order.id;
        this.persist();
        this.router.navigate(['/dashboard/build-orders/manage']);
    }

    public duplicate(): void {
        if (!this.selected) {
            return;
        }
        const clone = this.buildOrderService.duplicate(this.selected);
        this.orders.unshift(clone);
        this.selectedId = clone.id;
        this.persist();
    }

    public remove(): void {
        if (this.orders.length <= 1 || !this.selected) {
            return;
        }
        this.orders = this.orders.filter(order => order.id !== this.selectedId);
        this.selectedId = this.orders[0].id;
        if (!this.orders.some(order => order.id === this.activeId)) {
            this.activeId = '';
        }
        this.persist();
    }

    public activate(): void {
        if (!this.selected) {
            return;
        }
        this.activeId = this.selected.id;
        this.buildOrderService.resetProgress(this.selected);
        this.persist();
    }

    public stop(): void {
        this.activeId = '';
        this.persist();
    }

    public addStep(): void {
        if (!this.selected) {
            return;
        }
        const lastStep = this.selected.steps[this.selected.steps.length - 1];
        this.selected.steps.push(this.buildOrderService.createStep((lastStep?.atSeconds || 0) + 30, 'custom', '', 'New checkpoint'));
        this.persist();
    }

    public removeStep(step: BuildOrderStep): void {
        if (!this.selected) {
            return;
        }
        this.selected.steps = this.selected.steps.filter(item => item.id !== step.id);
        this.persist();
    }

    public importOrder(): void {
        this.importError = '';
        if (!this.importCode) {
            return;
        }
        try {
            const order = this.buildOrderService.decode(this.importCode);
            this.orders.unshift(order);
            this.selectedId = order.id;
            this.importCode = '';
            this.persist();
        } catch {
            this.importError = 'Invalid build order code';
        }
    }

    public publishSelected(): void {
        if (!this.selected) {
            return;
        }
        const identity = this.publisherIdentities.find(item => item.id === this.publisherIdentityId) || this.publisherIdentities[0];
        if (!identity) {
            return;
        }
        const publicOrder = this.buildOrderService.publish(this.selected, identity);
        this.publicOrders = this.buildOrderService.listPublicOrders(this.orders);
        this.persist();
        this.publishMessage = '"' + publicOrder.name + '" is public as ' + publicOrder.publisherDisplayName + '.';
    }

    public installPublicOrder(order: PublicBuildOrder): void {
        const installed = this.buildOrderService.installPublicOrder(order);
        this.orders.unshift(installed);
        this.selectedId = installed.id;
        this.activeId = installed.id;
        this.buildOrderService.resetProgress(installed);
        this.persist();
        this.publicOrders = this.buildOrderService.listPublicOrders(this.orders);
    }

    public activatePublicOrder(order: PublicBuildOrder): void {
        const existing = this.orders.find(local => local.id === order.id || local.name === order.name);
        if (existing) {
            this.selectedId = existing.id;
            this.activeId = existing.id;
            this.buildOrderService.resetProgress(existing);
            this.persist();
            return;
        }
        this.installPublicOrder(order);
    }

    public updateStepTime(step: BuildOrderStep, value: string): void {
        step.atSeconds = this.buildOrderService.parseTime(value);
        this.persist();
    }

    public persist(): void {
        this.buildOrderService.save({
            orders: this.orders,
            selectedId: this.selectedId,
            activeId: this.activeId
        });
        this.refreshShareCode();
    }

    public completion(order: BuildOrder): number {
        return this.buildOrderService.completion(order);
    }

    public get visiblePublicOrders(): PublicBuildOrder[] {
        if (this.raceFilter === 'all') {
            return this.publicOrders;
        }
        return this.publicOrders.filter(order => order.race === this.raceFilter);
    }

    public get publisherIdentities(): BuildOrderPublisherIdentity[] {
        const identities: BuildOrderPublisherIdentity[] = [{
            id: 'w3booster:' + (this.user?.id || 'local'),
            provider: 'w3booster',
            label: this.user?.displayName || this.user?.username || 'W3Booster account'
        }];
        for (const account of this.user?.connectedAccounts || []) {
            identities.push(this.toPublisherIdentity(account));
        }
        return identities;
    }

    public isInstalled(order: PublicBuildOrder): boolean {
        return this.orders.some(local => local.id === order.id || local.name === order.name);
    }

    private refreshShareCode(): void {
        this.shareCode = this.selected ? this.buildOrderService.encode(this.selected) : '';
    }

    private toPublisherIdentity(account: ConnectedAccount): BuildOrderPublisherIdentity {
        const label = account.displayName || account.login || account.id;
        return {
            id: account.provider + ':' + account.id,
            provider: account.provider,
            label
        };
    }
}

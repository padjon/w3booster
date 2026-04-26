import { Component, OnInit } from '@angular/core';

import { BuildOrder, BuildOrderService, BuildOrderStep } from '../../services/build-order.service';

@Component({
    selector: 'app-build-orders-page',
    templateUrl: './build-orders-page.component.html',
    styleUrls: ['../dashboard-page.css']
})
export class BuildOrdersPageComponent implements OnInit {
    public orders: BuildOrder[] = [];
    public selectedId = '';
    public activeId = '';
    public shareCode = '';
    public importCode = '';
    public importError = '';

    constructor(public buildOrderService: BuildOrderService) {}

    public ngOnInit(): void {
        const state = this.buildOrderService.load();
        this.orders = state.orders;
        this.selectedId = state.selectedId;
        this.activeId = state.activeId;
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

    private refreshShareCode(): void {
        this.shareCode = this.selected ? this.buildOrderService.encode(this.selected) : '';
    }
}

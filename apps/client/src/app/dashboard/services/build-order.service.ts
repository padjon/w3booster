import { Injectable } from '@angular/core';

export type BuildOrderAction = 'train' | 'build' | 'upgrade' | 'custom';
export type BuildOrderStepStatus = 'pending' | 'active' | 'done' | 'late' | 'missed';

export interface BuildOrderStep {
    id: string;
    atSeconds: number;
    action: BuildOrderAction;
    target: string;
    label: string;
    toleranceSeconds: number;
    status: BuildOrderStepStatus;
    completedAtSeconds?: number;
}

export interface BuildOrder {
    id: string;
    name: string;
    race: string;
    matchup: string;
    description: string;
    visibility: 'private' | 'shared';
    autoSelect: boolean;
    steps: BuildOrderStep[];
    updatedAt: number;
}

export interface BuildOrderState {
    orders: BuildOrder[];
    selectedId: string;
    activeId: string;
}

@Injectable()
export class BuildOrderService {
    public readonly races = ['any', 'human', 'orc', 'undead', 'night elf', 'random'];
    public readonly actions: BuildOrderAction[] = ['train', 'build', 'upgrade', 'custom'];

    private readonly storageKey = 'W3BOOSTER_BUILD_ORDERS';
    private readonly selectedKey = 'W3BOOSTER_SELECTED_BUILD_ORDER';
    private readonly activeKey = 'W3BOOSTER_ACTIVE_BUILD_ORDER';

    public load(): BuildOrderState {
        let orders: BuildOrder[] = [];
        try {
            orders = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
        } catch {
            orders = [];
        }

        if (!orders.length) {
            orders = [this.createStarterOrder()];
        }

        let selectedId = localStorage.getItem(this.selectedKey) || orders[0].id;
        if (!orders.some(order => order.id === selectedId)) {
            selectedId = orders[0].id;
        }

        let activeId = localStorage.getItem(this.activeKey) || '';
        if (!orders.some(order => order.id === activeId)) {
            activeId = '';
        }

        return { orders, selectedId, activeId };
    }

    public save(state: BuildOrderState): void {
        for (const order of state.orders) {
            order.updatedAt = Date.now();
            order.steps = order.steps || [];
            order.steps.sort((a, b) => a.atSeconds - b.atSeconds);
        }
        localStorage.setItem(this.storageKey, JSON.stringify(state.orders));
        localStorage.setItem(this.selectedKey, state.selectedId);
        if (state.activeId) {
            localStorage.setItem(this.activeKey, state.activeId);
        } else {
            localStorage.removeItem(this.activeKey);
        }
    }

    public createOrder(name = 'New Build Order'): BuildOrder {
        const order = this.createDefaultOrder(name);
        order.steps = [
            this.createStep(30, 'train', 'worker', 'Queue the next worker'),
            this.createStep(55, 'build', 'altar', 'Start hero tech')
        ];
        return order;
    }

    public duplicate(order: BuildOrder): BuildOrder {
        const clone = JSON.parse(JSON.stringify(order)) as BuildOrder;
        clone.id = this.createId('bo');
        clone.name = order.name + ' copy';
        clone.visibility = 'private';
        clone.updatedAt = Date.now();
        clone.steps = clone.steps.map(step => ({
            ...step,
            id: this.createId('step'),
            status: 'pending',
            completedAtSeconds: undefined
        }));
        return clone;
    }

    public createStep(atSeconds: number, action: BuildOrderAction, target: string, label: string): BuildOrderStep {
        return {
            id: this.createId('step'),
            atSeconds,
            action,
            target,
            label,
            toleranceSeconds: 10,
            status: 'pending'
        };
    }

    public resetProgress(order: BuildOrder): void {
        for (const step of order.steps) {
            step.status = 'pending';
            step.completedAtSeconds = undefined;
        }
    }

    public completion(order: BuildOrder): number {
        if (!order || !order.steps.length) {
            return 0;
        }
        return Math.round(order.steps.filter(step => step.status === 'done').length / order.steps.length * 100);
    }

    public formatTime(seconds: number): string {
        seconds = Math.max(0, Number(seconds) || 0);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return minutes + ':' + remainingSeconds.toString().padStart(2, '0');
    }

    public parseTime(value: string): number {
        if (!value) {
            return 0;
        }
        const parts = value.split(':').map(part => Number(part));
        if (parts.length === 1) {
            return parts[0] || 0;
        }
        return (parts[0] || 0) * 60 + (parts[1] || 0);
    }

    public encode(order: BuildOrder): string {
        return btoa(unescape(encodeURIComponent(JSON.stringify(order))));
    }

    public decode(code: string): BuildOrder {
        const order = JSON.parse(decodeURIComponent(escape(atob(code)))) as BuildOrder;
        order.id = this.createId('bo');
        order.visibility = 'private';
        order.updatedAt = Date.now();
        order.steps = (order.steps || []).map(step => ({
            ...step,
            id: this.createId('step'),
            atSeconds: Number(step.atSeconds) || 0,
            toleranceSeconds: Number(step.toleranceSeconds) || 10,
            status: 'pending',
            completedAtSeconds: undefined
        }));
        return order;
    }

    private createStarterOrder(): BuildOrder {
        const first = this.createDefaultOrder('Human opener drill');
        first.race = 'human';
        first.matchup = 'any';
        first.description = 'Starter checklist. Replace targets with exact game-data names once recorder mappings are finalized.';
        first.steps = [
            this.createStep(30, 'train', 'worker', 'Queue worker'),
            this.createStep(45, 'build', 'altar', 'Start Altar'),
            this.createStep(65, 'build', 'farm', 'Start first supply building')
        ];
        return first;
    }

    private createDefaultOrder(name: string): BuildOrder {
        return {
            id: this.createId('bo'),
            name,
            race: 'any',
            matchup: 'any',
            description: '',
            visibility: 'private',
            autoSelect: true,
            steps: [],
            updatedAt: Date.now()
        };
    }

    private createId(prefix: string): string {
        return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 8);
    }
}

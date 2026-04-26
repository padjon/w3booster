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
    visibility: 'private' | 'shared' | 'public';
    autoSelect: boolean;
    publisherIdentityId?: string;
    publisherDisplayName?: string;
    publisherProvider?: string;
    publishedAt?: number;
    stats?: BuildOrderPublicStats;
    steps: BuildOrderStep[];
    updatedAt: number;
}

export interface BuildOrderPublicStats {
    rating: number;
    starCount: number;
    selectedCount: number;
    selectedLastMonth: number;
    executedLastMonth: number;
}

export interface BuildOrderPublisherIdentity {
    id: string;
    provider: string;
    label: string;
}

export interface PublicBuildOrder extends BuildOrder {
    publisherDisplayName: string;
    publisherProvider: string;
    stats: BuildOrderPublicStats;
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
    private readonly publicStorageKey = 'W3BOOSTER_PUBLIC_BUILD_ORDERS';

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

    public listPublicOrders(localOrders: BuildOrder[] = []): PublicBuildOrder[] {
        const publishedLocal = localOrders
            .filter(order => order.visibility === 'public')
            .map(order => this.toPublicOrder(order));
        const knownIds = new Set(publishedLocal.map(order => order.id));
        const storedPublic = this.loadStoredPublicOrders().filter(order => !knownIds.has(order.id));
        const seedPublic = this.createSeedPublicOrders().filter(order => !knownIds.has(order.id) && !storedPublic.some(stored => stored.id === order.id));
        return [...publishedLocal, ...storedPublic, ...seedPublic]
            .sort((a, b) => this.publicScore(b) - this.publicScore(a));
    }

    public publish(order: BuildOrder, identity: BuildOrderPublisherIdentity): PublicBuildOrder {
        order.visibility = 'public';
        order.publisherIdentityId = identity.id;
        order.publisherDisplayName = identity.label;
        order.publisherProvider = identity.provider;
        order.publishedAt = Date.now();
        order.stats = order.stats || this.createEmptyStats();
        return this.toPublicOrder(order);
    }

    public installPublicOrder(order: PublicBuildOrder): BuildOrder {
        const clone = JSON.parse(JSON.stringify(order)) as BuildOrder;
        clone.id = this.createId('bo');
        clone.name = order.name;
        clone.visibility = 'private';
        clone.autoSelect = true;
        clone.updatedAt = Date.now();
        clone.steps = (clone.steps || []).map(step => ({
            ...step,
            id: this.createId('step'),
            status: 'pending',
            completedAtSeconds: undefined
        }));
        return clone;
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

    public formatRating(rating: number): string {
        return (Math.round((Number(rating) || 0) * 10) / 10).toFixed(1);
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

    private toPublicOrder(order: BuildOrder): PublicBuildOrder {
        return {
            ...JSON.parse(JSON.stringify(order)),
            visibility: 'public',
            publisherDisplayName: order.publisherDisplayName || 'W3Booster player',
            publisherProvider: order.publisherProvider || 'w3booster',
            stats: order.stats || this.createEmptyStats()
        };
    }

    private loadStoredPublicOrders(): PublicBuildOrder[] {
        try {
            return JSON.parse(localStorage.getItem(this.publicStorageKey) || '[]');
        } catch {
            return [];
        }
    }

    private createSeedPublicOrders(): PublicBuildOrder[] {
        const human = this.createDefaultOrder('Human fast expansion punish');
        human.id = 'public-human-fs-expand-punish';
        human.race = 'orc';
        human.matchup = 'orcvhuman';
        human.description = 'Pressure scout, shop timing, and second burrow discipline against Human fast expansion.';
        human.publisherDisplayName = 'Grubby';
        human.publisherProvider = 'twitch';
        human.publishedAt = Date.now() - 21 * 24 * 60 * 60 * 1000;
        human.stats = { rating: 4.8, starCount: 342, selectedCount: 9210, selectedLastMonth: 1184, executedLastMonth: 773 };
        human.steps = [
            this.createStep(18, 'train', 'peon', 'Keep Peon production continuous'),
            this.createStep(42, 'build', 'burrow', 'Second Burrow before supply pressure'),
            this.createStep(75, 'build', 'shop', 'Shop timing for pressure window'),
            this.createStep(145, 'custom', 'scout-expand', 'Confirm Human expansion commitment')
        ];

        const undead = this.createDefaultOrder('Undead DK fast tech');
        undead.id = 'public-undead-dk-fast-tech';
        undead.race = 'undead';
        undead.matchup = 'undeadvnightelf';
        undead.description = 'Clean Death Knight opener with tech timing and early scout checks.';
        undead.publisherDisplayName = 'Happy';
        undead.publisherProvider = 'battlenet';
        undead.publishedAt = Date.now() - 34 * 24 * 60 * 60 * 1000;
        undead.stats = { rating: 4.9, starCount: 501, selectedCount: 12140, selectedLastMonth: 1420, executedLastMonth: 910 };
        undead.steps = [
            this.createStep(22, 'train', 'acolyt', 'Queue Acolyte immediately'),
            this.createStep(38, 'build', 'crypt', 'Crypt before first scout return'),
            this.createStep(62, 'build', 'altar', 'Altar on time for DK'),
            this.createStep(172, 'upgrade', 'tier2', 'Start tech without floating')
        ];

        const nightElf = this.createDefaultOrder('Night Elf keeper pressure');
        nightElf.id = 'public-nightelf-keeper-pressure';
        nightElf.race = 'night elf';
        nightElf.matchup = 'nightelfvundead';
        nightElf.description = 'Keeper pressure plan with early moonwell safety and archer count checkpoints.';
        nightElf.publisherDisplayName = 'Moon';
        nightElf.publisherProvider = 'twitch';
        nightElf.publishedAt = Date.now() - 9 * 24 * 60 * 60 * 1000;
        nightElf.stats = { rating: 4.7, starCount: 287, selectedCount: 7380, selectedLastMonth: 990, executedLastMonth: 612 };
        nightElf.steps = [
            this.createStep(16, 'train', 'wisp', 'Do not pause Wisp production'),
            this.createStep(39, 'build', 'moonwell', 'First Moon Well before pressure'),
            this.createStep(70, 'build', 'altar', 'Altar into Keeper'),
            this.createStep(132, 'train', 'archer', 'Keep Archer count growing')
        ];

        return [human, undead, nightElf].map(order => this.toPublicOrder(order));
    }

    private createEmptyStats(): BuildOrderPublicStats {
        return {
            rating: 0,
            starCount: 0,
            selectedCount: 0,
            selectedLastMonth: 0,
            executedLastMonth: 0
        };
    }

    private publicScore(order: PublicBuildOrder): number {
        return order.stats.rating * 100000 + order.stats.starCount * 10 + order.stats.selectedLastMonth;
    }

    private createId(prefix: string): string {
        return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 8);
    }
}

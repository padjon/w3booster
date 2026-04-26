import { Injectable } from '@angular/core';

export interface MockNotification {
    id: string;
    type: 'gift.received' | 'replay.analyzed' | 'automation.error' | 'pro.expiring' | 'system';
    title: string;
    body: string;
    createdAt: string;
    read: boolean;
    cta?: string;
}

export interface MockOverlayPreset {
    id: string;
    name: string;
    type: string;
    widgets: string[];
    status: string;
    shared: boolean;
    thumbnail: string;
}

export interface MockAutomationRule {
    id: string;
    name: string;
    trigger: string;
    action: string;
    enabled: boolean;
    runs: number;
}

export interface MockReplay {
    id: string;
    opponent: string;
    race: string;
    matchup: string;
    result: 'Win' | 'Loss';
    duration: string;
    apm: number;
    supplyBlock: string;
    percentile: number;
}

@Injectable()
export class MockDataService {
    public getNotifications(): MockNotification[] {
        return [
            {
                id: 'n1',
                type: 'gift.received',
                title: 'Gift Pro received',
                body: 'Dreadcaster gifted you 30 days of Pro.',
                createdAt: 'Today',
                read: false,
                cta: '/dashboard/account'
            },
            {
                id: 'n2',
                type: 'replay.analyzed',
                title: 'Replay ready',
                body: 'Human vs Orc on Last Refuge is ready for review.',
                createdAt: '1h ago',
                read: false,
                cta: '/dashboard/insights/replay/r1'
            },
            {
                id: 'n3',
                type: 'automation.error',
                title: 'Rule failed',
                body: 'OBS scene switch could not reach the local socket.',
                createdAt: 'Yesterday',
                read: true,
                cta: '/dashboard/automation'
            },
            {
                id: 'n4',
                type: 'pro.expiring',
                title: 'Pro expires soon',
                body: 'Your current Pro period expires in 7 days.',
                createdAt: '2d ago',
                read: true,
                cta: '/dashboard/account'
            },
            {
                id: 'n5',
                type: 'system',
                title: 'Overlay editor preview',
                body: 'The new preset editor is now available in mock mode.',
                createdAt: '3d ago',
                read: true,
                cta: '/dashboard/overlays'
            }
        ];
    }

    public getOverlayPresets(): MockOverlayPreset[] {
        return [
            {
                id: 'quick',
                name: 'Quick preset',
                type: 'Built-in',
                widgets: ['Match bar', 'Heroes', 'Gold and supply'],
                status: 'Free',
                shared: false,
                thumbnail: 'linear-gradient(135deg, #0d7ad6, #08111f)'
            },
            {
                id: 'caster',
                name: 'Caster story stack',
                type: 'Stream',
                widgets: ['Win probability', 'Story so far', 'Researches'],
                status: 'Pro',
                shared: true,
                thumbnail: 'linear-gradient(135deg, #42c483, #0f2236)'
            },
            {
                id: 'practice',
                name: 'Practice drill',
                type: 'Player',
                widgets: ['Build tracker', 'Timer', 'Supply warnings'],
                status: 'Free',
                shared: false,
                thumbnail: 'linear-gradient(135deg, #f1a33b, #142a44)'
            },
            {
                id: 'tournament',
                name: 'Tournament desk',
                type: 'Cast',
                widgets: ['Army value', 'Income gauge', 'Hero XP'],
                status: 'Pro',
                shared: true,
                thumbnail: 'linear-gradient(135deg, #6ec3ff, #073b6c)'
            }
        ];
    }

    public getAutomationRules(): MockAutomationRule[] {
        return [
            { id: 'a1', name: 'Game start scene', trigger: 'game.started', action: 'OBS: In game', enabled: true, runs: 42 },
            { id: 'a2', name: 'Hero death sting', trigger: 'hero.killed', action: 'Sound: hero-down.wav', enabled: true, runs: 18 },
            { id: 'a3', name: 'Expansion alert', trigger: 'expansion.built', action: 'Discord webhook', enabled: false, runs: 9 }
        ];
    }

    public getEventLog(): string[] {
        return [
            '00:12 game.started - Echo Isles',
            '02:18 build.completed - Altar of Kings',
            '04:41 hero.leveled - Archmage level 2',
            '08:22 expansion.built - Opponent natural',
            '11:09 hero.killed - Blademaster'
        ];
    }

    public getReplays(): MockReplay[] {
        return [
            { id: 'r1', opponent: 'MoonWell', race: 'Human', matchup: 'vs Orc', result: 'Win', duration: '18:42', apm: 156, supplyBlock: '00:21', percentile: 72 },
            { id: 'r2', opponent: 'GhoulLine', race: 'Night Elf', matchup: 'vs Undead', result: 'Loss', duration: '24:05', apm: 132, supplyBlock: '01:08', percentile: 41 },
            { id: 'r3', opponent: 'TowerSmith', race: 'Orc', matchup: 'vs Human', result: 'Win', duration: '16:30', apm: 168, supplyBlock: '00:10', percentile: 81 },
            { id: 'r4', opponent: 'KeeperMain', race: 'Undead', matchup: 'vs Night Elf', result: 'Loss', duration: '21:18', apm: 121, supplyBlock: '01:34', percentile: 33 },
            { id: 'r5', opponent: 'Farseer99', race: 'Human', matchup: 'vs Orc', result: 'Win', duration: '19:54', apm: 149, supplyBlock: '00:38', percentile: 64 },
            { id: 'r6', opponent: 'CryptLord', race: 'Orc', matchup: 'vs Undead', result: 'Win', duration: '14:27', apm: 174, supplyBlock: '00:00', percentile: 88 }
        ];
    }

    public getGifts() {
        return [
            { sender: 'Dreadcaster', days: 30, message: 'Keep the ladder grind going.', date: 'Today' },
            { sender: 'Anonymous', days: 60, message: 'For the tournament stream.', date: 'March 29' }
        ];
    }

    public getBuildOrders() {
        return [
            { name: 'Human opener drill', race: 'Human', matchup: 'Any', completion: 67, steps: 18 },
            { name: 'Orc FS expand punish', race: 'Orc', matchup: 'vs Human', completion: 42, steps: 22 },
            { name: 'Undead DK fast tech', race: 'Undead', matchup: 'vs Night Elf', completion: 76, steps: 20 }
        ];
    }
}

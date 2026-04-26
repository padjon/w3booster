import { Component } from '@angular/core';

interface StyleguideSection {
    id: string;
    title: string;
}

@Component({
    selector: 'app-styleguide',
    templateUrl: './styleguide.component.html',
    styleUrls: ['./styleguide.component.scss']
})
export class StyleguideComponent {
    public readonly sections: StyleguideSection[] = [
        { id: 'foundations', title: 'Foundations' },
        { id: 'typography',  title: 'Typography' },
        { id: 'buttons',     title: 'Buttons' },
        { id: 'panels',      title: 'Panels & Cards' },
        { id: 'forms',       title: 'Forms' },
        { id: 'navigation',  title: 'Navigation' },
        { id: 'feedback',    title: 'Feedback' },
        { id: 'gamedata',    title: 'Game data' },
        { id: 'shell',       title: 'Shell preview' },
    ];

    public readonly vividSwatches = [
        { token: '$bn-violet-500',  value: '#7b5cf5' },
        { token: '$bn-cyan-500',    value: '#00d2ff' },
        { token: '$bn-magenta-500', value: '#ff3da3' },
        { token: '$bn-win-500',     value: '#3ddc97' },
        { token: '$bn-loss-500',    value: '#ff5b73' },
    ];

    public readonly tierSwatches = [
        { slug: 'iron',        label: 'Iron',        value: '#6c7488' },
        { slug: 'bronze',      label: 'Bronze',      value: '#c08956' },
        { slug: 'silver',      label: 'Silver',      value: '#cdd5e0' },
        { slug: 'gold',        label: 'Gold',        value: '#ffcd5e' },
        { slug: 'platinum',    label: 'Platinum',    value: '#6ee0c5' },
        { slug: 'diamond',     label: 'Diamond',     value: '#6ec3ff' },
        { slug: 'master',      label: 'Master',      value: '#b694ff' },
        { slug: 'grandmaster', label: 'Grandmaster', value: '#ff7c66' },
        { slug: 'champion',    label: 'Champion',    value: '#ffe27a' },
    ];

    public readonly demoMatches = [
        { result: 'win',  thumb: 'HU', title: 'Win vs MoonWell',  meta: 'Human · vs Orc · 18:42 · 156 APM',     percentile: 72, tier: 'platinum' },
        { result: 'loss', thumb: 'NE', title: 'Loss vs GhoulLine',meta: 'Night Elf · vs Undead · 24:05 · 132 APM', percentile: 41, tier: 'gold' },
        { result: 'win',  thumb: 'OR', title: 'Win vs TowerSmith',meta: 'Orc · vs Human · 16:30 · 168 APM',     percentile: 81, tier: 'diamond' },
    ];

    public readonly inkSwatches = [
        { token: '$bn-ink-900', value: '#04070d' },
        { token: '$bn-ink-800', value: '#08111f' },
        { token: '$bn-ink-700', value: '#0f2236' },
        { token: '$bn-ink-600', value: '#1b3556' },
        { token: '$bn-ink-500', value: '#234262' },
    ];

    public readonly accentSwatches = [
        { token: '$bn-blue-400', value: '#6ec3ff' },
        { token: '$bn-blue-500', value: '#2196f3' },
        { token: '$bn-blue-600', value: '#0d7ad6' },
        { token: '$bn-blue-700', value: '#0a5ba4' },
        { token: '$bn-blue-800', value: '#073b6c' },
    ];

    public readonly accentSwatchesGold = [
        { token: '$bn-gold-400', value: '#ffd166' },
        { token: '$bn-gold-500', value: '#f1a33b' },
        { token: '$bn-gold-600', value: '#c87a16' },
    ];

    public readonly statusSwatches = [
        { token: '$bn-status-online',  value: '#42c483' },
        { token: '$bn-status-busy',    value: '#f1a33b' },
        { token: '$bn-status-offline', value: '#67809b' },
        { token: '$bn-status-error',   value: '#df5c52' },
    ];

    public toggleA = true;
    public toggleB = false;

    public progressValue = 64;

    public navItems = [
        { label: 'Home',          icon: 'fa fa-th',         active: true  },
        { label: 'Build Orders',  icon: 'fa fa-list-ol',    active: false },
        { label: 'Player Overlay',icon: 'fa fa-gamepad',    active: false },
        { label: 'OBS / Replay',  icon: 'fa fa-desktop',    active: false },
        { label: 'Automation',    icon: 'fa fa-robot',      active: false, disabled: true },
    ];
}

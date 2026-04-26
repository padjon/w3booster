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
        { id: 'shell',       title: 'Shell preview' },
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

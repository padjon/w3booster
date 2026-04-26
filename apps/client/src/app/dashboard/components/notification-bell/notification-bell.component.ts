import { Component } from '@angular/core';

import { MockDataService, MockNotification } from '../../services/mock-data.service';

@Component({
    selector: 'app-notification-bell',
    templateUrl: './notification-bell.component.html',
    styleUrls: ['./notification-bell.component.css']
})
export class NotificationBellComponent {
    public open = false;
    public notifications: MockNotification[];

    constructor(private data: MockDataService) {
        this.notifications = this.data.getNotifications();
    }

    public get unreadCount(): number {
        return this.notifications.filter(notification => !notification.read).length;
    }
}

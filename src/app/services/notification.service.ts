import { Injectable, inject, effect } from '@angular/core';
import { FinanceDataService } from './finance-data.service';

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    private financeData = inject(FinanceDataService);
    private checkInterval: any;

    constructor() {
        // React to settings changes
        effect(() => {
            const settings = this.financeData.userSettings();
            if (settings.notificationEnabled) {
                this.requestPermission();
                this.startChecking();
            } else {
                this.stopChecking();
            }
        });
    }

    async requestPermission() {
        if (!('Notification' in window)) {
            console.warn('Цей браузер не підтримує сповіщення.');
            return;
        }

        if (Notification.permission === 'default') {
            try {
                await Notification.requestPermission();
            } catch (err) {
                console.error('Помилка при запиті дозволу на сповіщення:', err);
            }
        }
    }

    private startChecking() {
        if (this.checkInterval) return;

        // Check every minute if it's time to notify
        this.checkInterval = setInterval(() => {
            this.checkAndNotify();
        }, 60000);

        // Also check immediately
        this.checkAndNotify();
    }

    private stopChecking() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    }

    private lastNotifiedDate: string | null = null;

    private checkAndNotify() {
        const settings = this.financeData.userSettings();
        if (!settings.notificationEnabled || !settings.notificationTime) return;

        if (Notification.permission !== 'granted') {
            return;
        }

        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        const today = now.toDateString();

        if (currentTime === settings.notificationTime && this.lastNotifiedDate !== today) {
            this.showNotification(
                'Нагадування',
                settings.notificationText || 'Час заповнити витрати! 💸'
            );
            this.lastNotifiedDate = today;
        }
    }

    showNotification(title: string, body: string) {
        if (Notification.permission === 'granted') {
            const options = {
                body: body,
                icon: 'assets/icons/icon-128x128.png',
                badge: 'assets/icons/icon-72x72.png',
                vibrate: [200, 100, 200]
            };

            // Try showing via service worker if available (better for PWA)
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.ready.then(registration => {
                    registration.showNotification(title, options);
                });
            } else {
                new Notification(title, options);
            }
        }
    }
}

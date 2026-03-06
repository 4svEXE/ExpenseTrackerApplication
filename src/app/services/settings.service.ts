import { Injectable, signal } from '@angular/core';

export interface UserSettings {
    name: string;
    monthlyIncomeGoal: number;
    currency: 'UAH' | 'USD' | 'EUR' | 'CZK';
    soundEnabled: boolean;
    soundVolume: number; // 0 to 1
    vibrationEnabled: boolean;
    taxRate?: number; // percentage
    taxFixedAmount?: number; // fixed amount per month
    taxFixedCurrency?: 'UAH' | 'USD' | 'EUR' | 'CZK';
    notificationEnabled?: boolean;
    notificationTime?: string; // HH:mm
    notificationText?: string;
    gamificationEnabled?: boolean;
    showPlanPostTransaction?: boolean;
    supportDonationReminder?: boolean;
    eventsEnabled?: boolean;
    visualImpairmentMode?: boolean;
    colorBlindMode?: boolean;
    coins?: number;
    avatarUrl?: string;
}

@Injectable({
    providedIn: 'root'
})
export class SettingsService {
    private readonly SETTINGS_KEY = 'userSettings';

    userSettings = signal<UserSettings>({
        name: 'Бомжулька',
        monthlyIncomeGoal: 14000,
        currency: 'UAH',
        soundEnabled: true,
        soundVolume: 0.5,
        vibrationEnabled: true,
        taxRate: 5,
        taxFixedAmount: 0,
        taxFixedCurrency: 'UAH',
        notificationEnabled: true,
        notificationTime: '20:00',
        notificationText: 'Час заповнити витрати! 💸',
        gamificationEnabled: true,
        showPlanPostTransaction: false,
        supportDonationReminder: true,
        eventsEnabled: true,
        visualImpairmentMode: false,
        colorBlindMode: false,
        coins: 0,
        avatarUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Lucky'
    });

    constructor() {
        this.loadSettings();
    }

    loadSettings() {
        const saved = localStorage.getItem(this.SETTINGS_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                this.userSettings.set({
                    ...this.userSettings(),
                    ...parsed
                });
            } catch (e) {
                console.error('Failed to parse settings', e);
            }
        }
    }

    saveSettings(settings: UserSettings) {
        this.userSettings.set(settings);
        localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
    }
}

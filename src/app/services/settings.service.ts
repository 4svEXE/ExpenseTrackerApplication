import { Injectable, signal } from '@angular/core';

export interface UserSettings {
    name: string;
    monthlyIncomeGoal: number;
    currency: 'UAH' | 'USD' | 'EUR' | 'CZK';
    soundEnabled: boolean;
    soundVolume: number; // 0 to 1
    vibrationEnabled: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class SettingsService {
    private readonly SETTINGS_KEY = 'userSettings';

    userSettings = signal<UserSettings>({
        name: 'ФОП',
        monthlyIncomeGoal: 140000,
        currency: 'UAH',
        soundEnabled: true,
        soundVolume: 0.5,
        vibrationEnabled: true
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

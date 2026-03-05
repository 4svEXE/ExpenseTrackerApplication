import { Injectable, inject } from '@angular/core';
import { SettingsService } from './settings.service';

@Injectable({
    providedIn: 'root'
})
export class AudioService {
    private settingsService = inject(SettingsService);

    private playSound(path: string) {
        const settings = this.settingsService.userSettings();
        if (!settings.soundEnabled) return;

        const audio = new Audio(path);
        audio.volume = settings.soundVolume;
        audio.play().catch(err => console.warn('Audio playback failed (user interaction might be needed)', err));

        if (settings.vibrationEnabled && navigator.vibrate) {
            try {
                navigator.vibrate(200);
            } catch (e) {
                // Vibrate might fail on some platforms/permissions
            }
        }
    }

    playIncome() {
        this.playSound('/audio/income.mp3');
    }

    playOutcome() {
        this.playSound('/audio/outcome.mp3');
    }

    playChallengeComplete() {
        this.playSound('/audio/challenge_complete.mp3');
    }
}

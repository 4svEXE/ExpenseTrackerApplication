import { Injectable, inject } from '@angular/core';
import { SettingsService } from './settings.service';

@Injectable({
    providedIn: 'root'
})
export class AudioService {
    private settingsService = inject(SettingsService);

    private playSound(path: string) {
        const settings = this.settingsService.userSettings();
        if (settings.soundEnabled) {
            const audio = new Audio(path);
            audio.volume = settings.soundVolume;
            audio.play().catch(err => console.warn('Audio playback failed', err));
        }

        if (settings.vibrationEnabled) {
            this.vibrate();
        }
    }

    vibrate(pattern: number | number[] = 200) {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            try {
                // Some mobile browsers need a pattern to be really felt
                const p = typeof pattern === 'number' ? [pattern] : pattern;
                navigator.vibrate(p);
            } catch (e) {
                console.warn('Vibration failed', e);
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

    playTest(volume: number) {
        const audio = new Audio('/audio/income.mp3');
        audio.volume = volume;
        audio.play().catch(e => console.warn(e));
        this.vibrate([100, 50, 100]);
    }
}

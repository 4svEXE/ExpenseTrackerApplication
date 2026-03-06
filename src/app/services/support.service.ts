import { Injectable, signal, inject } from '@angular/core';
import { FinanceDataService } from './finance-data.service';
import { AudioService } from './audio.service';

export interface SupportModalConfig {
    isOpen: boolean;
    type: 'donation_request' | 'feedback_loop' | 'gratitude';
    upsetCount: number;
}

@Injectable({
    providedIn: 'root'
})
export class SupportService {
    private financeData = inject(FinanceDataService);
    private audio = inject(AudioService);

    config = signal<SupportModalConfig>({
        isOpen: false,
        type: 'donation_request',
        upsetCount: 0
    });

    showDonationRequest() {
        if (!this.financeData.userSettings().supportDonationReminder) return;
        this.config.update(c => ({ ...c, isOpen: true, type: 'donation_request' }));
    }

    showFeedbackLoop() {
        this.config.update(c => ({ ...c, isOpen: true, type: 'feedback_loop' }));
    }

    handleNo() {
        const current = this.config();
        const newCount = current.upsetCount + 1;

        // Remove coins
        this.financeData.addCoins(-5);
        this.audio.playOutcome(); // Use existsing outcome sound for penalty

        if (newCount >= 5) {
            this.triggerUpsideDown();
            this.config.update(c => ({ ...c, isOpen: false, upsetCount: 0 }));
        } else {
            this.config.update(c => ({ ...c, upsetCount: newCount }));
        }
    }

    handleYes() {
        this.config.update(c => ({ ...c, type: 'gratitude' }));
    }

    close() {
        this.config.update(c => ({ ...c, isOpen: false, upsetCount: 0 }));
    }

    private triggerUpsideDown() {
        document.body.style.transition = 'transform 0.5s ease-in-out';
        document.body.style.transform = 'rotate(180deg)';
        setTimeout(() => {
            document.body.style.transform = 'rotate(0deg)';
        }, 20000);
    }
}

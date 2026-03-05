import { Injectable, inject } from '@angular/core';
import { FinanceDataService } from './finance-data.service';

@Injectable({
    providedIn: 'root'
})
export class CoinAnimationService {
    private financeData = inject(FinanceDataService);

    animate(startX: number, startY: number) {
        if (!this.financeData.userSettings().gamificationEnabled) return;

        // 1. Create coin element
        const coin = document.createElement('img');
        coin.src = 'icons/logo.svg';
        coin.style.position = 'fixed';
        coin.style.left = `${startX}px`;
        coin.style.top = `${startY}px`;
        coin.style.width = '24px';
        coin.style.height = '24px';
        coin.style.zIndex = '9999';
        coin.style.transition = 'all 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        coin.style.pointerEvents = 'none';

        document.body.appendChild(coin);

        // 2. Find target (app logo)
        const target = document.getElementById('app-logo');
        if (!target) {
            setTimeout(() => document.body.removeChild(coin), 100);
            return;
        }

        const targetRect = target.getBoundingClientRect();
        const targetX = targetRect.left + targetRect.width / 2 - 12;
        const targetY = targetRect.top + targetRect.height / 2 - 12;

        // 3. Trigger animation
        requestAnimationFrame(() => {
            coin.style.left = `${targetX}px`;
            coin.style.top = `${targetY}px`;
            coin.style.transform = 'scale(1.5) rotate(360deg)';
            coin.style.opacity = '0.7';
        });

        // 4. Cleanup and Reward
        setTimeout(() => {
            if (document.body.contains(coin)) {
                document.body.removeChild(coin);
            }

            // Bump the logo
            target.style.transform = 'scale(1.2)';
            setTimeout(() => target.style.transform = 'scale(1)', 200);

            // Add count
            this.financeData.addCoins(1);
        }, 800);
    }
}

import { Injectable, signal } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class ConfirmService {
    isOpen = signal(false);
    message = signal('');
    private resolveConfirm?: (value: boolean) => void;

    confirm(message: string): Promise<boolean> {
        this.message.set(message);
        this.isOpen.set(true);
        return new Promise((resolve) => {
            this.resolveConfirm = resolve;
        });
    }

    handleAction(confirmed: boolean) {
        this.isOpen.set(false);
        if (this.resolveConfirm) {
            this.resolveConfirm(confirmed);
            this.resolveConfirm = undefined;
        }
    }
}

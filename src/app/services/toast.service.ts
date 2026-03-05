import { Injectable, signal } from '@angular/core';

export interface Toast {
    message: string;
    type: 'success' | 'info' | 'error';
    id: number;
}

@Injectable({
    providedIn: 'root'
})
export class ToastService {
    toasts = signal<Toast[]>([]);

    show(message: string, type: 'success' | 'info' | 'error' = 'success') {
        const id = Date.now();
        this.toasts.update(t => [...t, { message, type, id }]);

        setTimeout(() => {
            this.toasts.update(t => t.filter(toast => toast.id !== id));
        }, 4000);
    }
}

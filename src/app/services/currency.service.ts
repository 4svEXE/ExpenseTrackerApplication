import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class CurrencyService {

    constructor() { }

    getExchangeRate(f: string, t: string): number {
        if (f === t) return 1;
        // Hardcoded rates for now, to be replaced with API later
        const r: any = { 'UAH': 1, 'USD': 38.5, 'EUR': 41.5, 'CZK': 1.6 };
        return (r[f] || 1) / (r[t] || 1);
    }

    getCurrencySymbol(currency: string): string {
        const symbols: Record<string, string> = {
            'UAH': '₴',
            'USD': '$',
            'EUR': '€',
            'CZK': 'Kč'
        };
        return symbols[currency] || currency;
    }
}

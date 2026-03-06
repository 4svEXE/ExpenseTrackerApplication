import { Component, inject, Output, EventEmitter } from '@angular/core';
import { FinanceDataService, Subscription } from '../../../services/finance-data.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-subscriptions-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card-container overflow-hidden h-full">
      <div class="p-3 md:p-6 border-b border-slate-100 flex justify-between items-center">
        <div>
          <h3 class="text-lg md:text-xl font-bold text-slate-800 drop-shadow-sm">Активні підписки</h3>
          <p class="text-[10px] md:text-sm text-slate-500">Регулярні платежі</p>
        </div>
        <button (click)="addSubscriptionClicked.emit()" class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-black hover:text-white transition-all active:scale-95">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
        </button>
      </div>
      
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm whitespace-nowrap">
          <thead class="bg-slate-50/50 text-slate-500 font-semibold tracking-wider uppercase text-[10px]">
            <tr>
              <th class="px-3 md:px-5 py-2 md:py-3">Сервіс</th>
              <th class="px-3 md:px-5 py-2 md:py-3">Ціна</th>
              <th class="px-3 md:px-5 py-2 md:py-3">Оплата</th>
              <th class="px-3 md:px-5 py-2 md:py-3 text-right">Витрачено</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr *ngFor="let s of subscriptions()" 
                (click)="onSubscriptionClick(s)"
                class="hover:bg-slate-50/50 transition-colors group cursor-pointer">
              <td class="px-3 md:px-5 py-3 md:py-4 font-bold text-slate-800 flex items-center gap-2 md:gap-3 text-xs md:text-sm">
                <div class="w-6 h-6 md:w-8 md:h-8 rounded bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-purple-100 group-hover:text-purple-600 transition-colors text-[10px] md:text-sm">
                  <!-- First letter of service as icon -->
                  {{ s.name.charAt(0) }}
                </div>
                {{ s.name }}
              </td>
              <td class="px-3 md:px-5 py-3 md:py-4 text-slate-600 font-medium text-xs md:text-sm">
                <div>{{ s.priceUah | currency:'UAH':'symbol-narrow':'1.0-0' }}</div>
                <div class="text-[9px] md:text-[10px] text-slate-400" *ngIf="s.priceEur">{{ s.priceEur | currency:'EUR':'symbol-narrow':'1.0-0' }}</div>
              </td>
              <td class="px-3 md:px-5 py-3 md:py-4">
                <div class="flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full" [ngClass]="getDaysLeft(s.nextPaymentDate) <= 3 ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'"></span>
                  <span class="font-medium text-slate-700">{{ s.nextPaymentDate | date:'d MMM':'':'uk-UA' }}</span>
                </div>
                <div class="text-xs font-semibold mt-1" [ngClass]="getDaysLeft(s.nextPaymentDate) <= 3 ? 'text-rose-500' : 'text-slate-400'">
                  через {{ getDaysLeft(s.nextPaymentDate) }} дн.
                </div>
              </td>
              <td class="px-5 py-4 text-right font-bold text-slate-800">
                {{ s.totalSpent | currency:'UAH':'symbol-narrow':'1.0-0' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .card-container {
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(12px);
      border-radius: 1.5rem;
      box-shadow: 0 10px 25px rgba(0,0,0,0.05);
    }
  `]
})
export class SubscriptionsListComponent {
  financeData = inject(FinanceDataService);
  subscriptions = this.financeData.subscriptions;

  @Output() subscriptionClicked = new EventEmitter<Subscription>();
  @Output() addSubscriptionClicked = new EventEmitter<void>();

  getDaysLeft(date: Date): number {
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  }

  onSubscriptionClick(s: Subscription) {
    this.subscriptionClicked.emit(s);
  }
}

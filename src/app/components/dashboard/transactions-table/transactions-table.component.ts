import { Component, inject } from '@angular/core';
import { FinanceDataService } from '../../../services/finance-data.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-transactions-table',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="card-container overflow-hidden">
      <div class="p-3 md:p-6 border-b border-slate-100 flex justify-between items-center">
        <div>
          <h3 class="text-lg md:text-xl font-bold text-slate-800 drop-shadow-sm">Останні транзакції</h3>
          <p class="text-[10px] md:text-sm text-slate-500">Операційний облік</p>
        </div>
        <button routerLink="/home" class="bg-neutral-900 text-white hover:bg-black px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-semibold transition-colors">
          Всі
        </button>
      </div>
      
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm whitespace-nowrap" *ngIf="recentTransactions.length > 0; else emptyState">
          <thead class="bg-slate-50/50 text-slate-500 font-semibold tracking-wider uppercase text-[10px]">
            <tr>
              <th class="px-3 md:px-6 py-2 md:py-4">Сума</th>
              <th class="px-3 md:px-6 py-2 md:py-4">Рахунок</th>
              <th class="px-3 md:px-6 py-2 md:py-4 text-right">Дата</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr *ngFor="let t of recentTransactions" class="hover:bg-slate-50/50 transition-colors">
              <td class="px-3 md:px-6 py-3 md:py-4 font-bold text-xs md:text-sm" [ngClass]="t.type === 'income' ? 'text-emerald-600' : 'text-slate-800'">
                {{ t.type === 'income' ? '+' : '-' }}{{ (t.amountUah * financeData.getExchangeRate('UAH', userCurrency)) | currency:userCurrency:'symbol-narrow':'1.0-0' }}
              </td>
              <td class="px-3 md:px-6 py-3 md:py-4">
                <div class="inline-flex items-center px-2 py-1 rounded-md bg-slate-50 border border-slate-100 text-slate-700 font-bold text-xs md:text-sm">
                  <i class="fa-solid fa-credit-card mr-1.5 opacity-40"></i>
                  {{ t.account }}
                </div>
              </td>
              <td class="px-3 md:px-6 py-3 md:py-4 text-right text-slate-500 font-medium text-[10px] md:text-sm">
                {{ t.date | date:'d MMM' }}
              </td>
            </tr>
          </tbody>
        </table>
        
        <ng-template #emptyState>
          <div class="py-12 flex flex-col items-center justify-center text-slate-400">
            <i class="fa-solid fa-receipt text-4xl mb-3 text-slate-300"></i>
            <p class="font-medium">Поки що транзакцій немає</p>
          </div>
        </ng-template>
      </div>
    </div>
  `,
  styles: [`
    .card-container {
      background: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(12px);
      border-radius: 1.5rem;
      box-shadow: 0 10px 25px rgba(0,0,0,0.05);
      border: 1px solid rgba(255,255,255,0.5);
    }
  `]
})
export class TransactionsTableComponent {
  financeData = inject(FinanceDataService);
  transactions = this.financeData.transactions;

  get recentTransactions() {
    return [...this.transactions()]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }

  get userCurrency() {
    return this.financeData.userSettings().currency;
  }
}

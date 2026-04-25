import { Component, inject } from '@angular/core';
import { FinanceDataService } from '../../../services/finance-data.service';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { TransactionService } from '../../../services/transaction.service';
import { Transaction } from '../../../types/transaction.interface';

@Component({
  selector: 'app-transactions-table',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="card-container overflow-hidden">
      <!-- Tab Header -->
      <div class="flex border-b border-slate-100">
        <button 
          (click)="activeTab = 'transactions'"
          [class.active-tab]="activeTab === 'transactions'"
          class="flex-1 py-4 text-xs md:text-sm font-bold uppercase tracking-wider text-slate-500 transition-all border-b-2 border-transparent">
          Транзакції
        </button>
        <button 
          (click)="activeTab = 'debts'"
          [class.active-tab]="activeTab === 'debts'"
          class="flex-1 py-4 text-xs md:text-sm font-bold uppercase tracking-wider text-slate-500 transition-all border-b-2 border-transparent">
          Борги
        </button>
      </div>

      <div class="p-4 md:p-6" *ngIf="activeTab === 'transactions'">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-sm font-black text-slate-400 uppercase tracking-widest">Останні операції</h3>
          <button routerLink="/home" class="text-[10px] font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-600">
            Всі <i class="fa-solid fa-chevron-right ml-1"></i>
          </button>
        </div>
        
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm whitespace-nowrap" *ngIf="recentTransactions.length > 0; else emptyTxs">
            <tbody class="divide-y divide-slate-50">
              <tr *ngFor="let t of recentTransactions" 
                  (click)="onTransactionClick(t)"
                  class="hover:bg-slate-50/50 transition-colors cursor-pointer group">
                <td class="py-3 font-bold text-xs md:text-sm" [ngClass]="t.type === 'income' ? 'text-emerald-600' : 'text-slate-800'">
                  {{ t.type === 'income' ? '+' : '-' }}{{ (t.amountUah * financeData.getExchangeRate('UAH', userCurrency)) | currency:userCurrency:'symbol-narrow':'1.0-0' }}
                </td>
                <td class="py-3 px-2">
                  <span class="text-[10px] md:text-xs font-bold text-slate-500">{{ t.account }}</span>
                </td>
                <td class="py-3 text-right text-slate-400 font-medium text-[10px] md:text-xs">
                  {{ t.date | date:'d MMM' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="p-4 md:p-6" *ngIf="activeTab === 'debts'">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-sm font-black text-slate-400 uppercase tracking-widest">Активні борги</h3>
          <button routerLink="/wallets" class="text-[10px] font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-600">
            Редагувати <i class="fa-solid fa-chevron-right ml-1"></i>
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm whitespace-nowrap" *ngIf="activeDebts.length > 0; else emptyDebts">
            <tbody class="divide-y divide-slate-50">
              <tr *ngFor="let d of activeDebts" class="hover:bg-slate-50/50 transition-colors">
                <td class="py-3 font-bold text-xs md:text-sm" [ngClass]="d.amount < 0 ? 'text-rose-600' : 'text-emerald-600'">
                  {{ d.amount > 0 ? '+' : '' }}{{ d.amount | currency:userCurrency:'symbol-narrow':'1.0-0' }}
                </td>
                <td class="py-3 px-2">
                  <span class="text-[10px] md:text-xs font-black text-slate-800">{{ d.name }}</span>
                </td>
                <td class="py-3 text-right">
                   <div class="inline-flex items-center px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter"
                        [ngClass]="d.amount < 0 ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'">
                     {{ d.amount < 0 ? 'Ви винні' : 'Вам винні' }}
                   </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <ng-template #emptyTxs>
        <div class="py-12 flex flex-col items-center justify-center text-slate-400">
          <i class="fa-solid fa-receipt text-2xl mb-2 opacity-20"></i>
          <p class="text-[10px] font-bold uppercase tracking-widest">Транзакцій немає</p>
        </div>
      </ng-template>

      <ng-template #emptyDebts>
        <div class="py-12 flex flex-col items-center justify-center text-slate-400">
          <i class="fa-solid fa-handshake-slash text-2xl mb-2 opacity-20"></i>
          <p class="text-[10px] font-bold uppercase tracking-widest">Боргів немає</p>
        </div>
      </ng-template>
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
    .active-tab {
      color: #18181b !important;
      border-bottom-color: #18181b !important;
    }
  `]
})
export class TransactionsTableComponent {
  financeData = inject(FinanceDataService);
  transactionService = inject(TransactionService);
  router = inject(Router);
  
  transactions = this.financeData.transactions;
  activeTab: 'transactions' | 'debts' = 'transactions';

  onTransactionClick(t: any) {
    // We need to ensure it's a full transaction object for the service
    this.transactionService.setTransaction(t);
    this.router.navigate(['/new-transaction', 'categories', t.type || 'expense']);
  }

  get recentTransactions() {
    return [...this.transactions()]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }

  get activeDebts() {
    return this.financeData.debts().filter(d => d.amount !== 0);
  }

  get userCurrency() {
    return this.financeData.userSettings().currency;
  }
}

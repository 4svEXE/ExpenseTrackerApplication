import { Component, inject, Output, EventEmitter } from '@angular/core';
import { FinanceDataService, AccountBalance } from '../../../services/finance-data.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-accounts-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card-container h-full pt-10">
      <div class="flex justify-between items-center mb-4 md:mb-6">
        <h3 class="text-lg md:text-xl font-bold text-slate-800 drop-shadow-sm">Рахунки та Картки</h3>
        <button (click)="addAccountClicked.emit()" class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-black hover:text-white transition-all active:scale-95">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
        </button>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div *ngFor="let acc of accounts()" 
             (click)="onAccountClick(acc)"
             class="group relative overflow-hidden rounded-xl p-4 transition-all duration-300 hover:-translate-y-1 shadow-sm hover:shadow-md cursor-pointer border border-slate-200"
             [style.backgroundColor]="acc.color || '#171717'">
             
          <!-- Decoration -->
          <div class="absolute -right-4 -bottom-4 w-20 h-20 bg-white/10 rounded-full blur-xl group-hover:bg-white/20 transition-all"></div>
          
          <div class="relative z-10">
            <div class="flex justify-between items-start mb-4">
              <div class="font-bold tracking-wide text-white drop-shadow-sm">{{ acc.name }}</div>
              <div class="flex gap-1" *ngIf="acc.currency !== userCurrency">
                <span class="text-[10px] bg-white/20 backdrop-blur-md px-1.5 py-0.5 rounded text-white font-medium uppercase">{{ acc.currency }}</span>
              </div>
            </div>

            <div class="flex flex-col gap-1">
              <div class="text-2xl font-extrabold text-white">{{ acc.balance | currency:acc.currency:'symbol-narrow':'1.0-0' }}</div>
            </div>

            <div class="mt-4 flex gap-1">
              <span *ngFor="let tag of acc.tags" class="text-[9px] uppercase tracking-wider bg-black/20 text-white/90 px-2 py-1 rounded-full backdrop-blur-sm">
                {{ tag }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .card-container {
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(12px);
      border-radius: 1.5rem;
      padding: 1rem;
      box-shadow: 0 10px 25px rgba(0,0,0,0.05);
    }
    @media (min-width: 768px) {
      .card-container {
        padding: 1.5rem;
      }
    }
  `]
})
export class AccountsListComponent {
  financeData = inject(FinanceDataService);
  accounts = this.financeData.accounts;

  @Output() accountClicked = new EventEmitter<AccountBalance>();
  @Output() addAccountClicked = new EventEmitter<void>();

  get userCurrency() {
    return this.financeData.userSettings().currency;
  }

  onAccountClick(acc: AccountBalance) {
    this.accountClicked.emit(acc);
  }

  onAddAccount() {
    const name = prompt('Введіть назву рахунку:');
    if (name) {
      this.financeData.addAccount({
        name,
        balance: 0,
        currency: this.userCurrency,
        tags: [],
        color: this.generateRandomColor()
      });
    }
  }

  private generateRandomColor(): string {
    const colors = ['#171717', '#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
    return colors[Math.floor(Math.random() * colors.length)];
  }
}

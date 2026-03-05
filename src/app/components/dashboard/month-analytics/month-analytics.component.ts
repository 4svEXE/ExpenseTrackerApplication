import { Component, inject } from '@angular/core';
import { FinanceDataService } from '../../../services/finance-data.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-month-analytics',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      
      <!-- Total Income -->
      <div class="analytics-card group">
        <div class="flex flex-col h-full bg-white/50 group-hover:bg-white/80 transition-all rounded-2xl p-4 md:p-5 border border-white/60 shadow-sm relative overflow-hidden">
          <div class="absolute -right-6 -top-6 w-24 h-24 bg-emerald-100 rounded-full blur-xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
          <div class="relative z-10">
            <h4 class="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Загальний дохід</h4>
            <div class="text-xl md:text-3xl font-extrabold text-slate-800">{{ factTotal | currency:userCurrency:'symbol-narrow':'1.0-0' }}</div>
          </div>
        </div>
      </div>

      <!-- Total Expenses -->
      <div class="analytics-card group">
        <div class="flex flex-col h-full bg-white/50 group-hover:bg-white/80 transition-all rounded-2xl p-4 md:p-5 border border-white/60 shadow-sm relative overflow-hidden">
          <div class="absolute -right-6 -top-6 w-24 h-24 bg-rose-100 rounded-full blur-xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
          <div class="relative z-10">
            <h4 class="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Загальні витрати</h4>
            <div class="text-xl md:text-3xl font-extrabold text-slate-800">{{ expensesTotal | currency:userCurrency:'symbol-narrow':'1.0-0' }}</div>
          </div>
        </div>
      </div>

      <!-- Taxes Reserved -->
      <div class="analytics-card group">
        <div class="flex flex-col h-full bg-white/50 group-hover:bg-white/80 transition-all rounded-2xl p-4 md:p-5 border border-white/60 shadow-sm relative overflow-hidden">
          <div class="absolute -right-6 -top-6 w-24 h-24 bg-slate-100 rounded-full blur-xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
          <div class="relative z-10">
            <h4 class="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Податки ({{ taxRate }}%{{ financeData.userSettings().taxFixedAmount ? ' + фікс' : '' }})
            </h4>
            <div class="text-xl md:text-3xl font-extrabold text-slate-800">{{ taxAmount | currency:userCurrency:'symbol-narrow':'1.0-0' }}</div>
            <div class="text-[9px] text-slate-400 mt-1 font-medium bg-slate-100/50 inline-block px-2 py-0.5 rounded-full">Авто-розрахунок</div>
          </div>
        </div>
      </div>

      <!-- Net Difference -->
      <div class="analytics-card group">
        <div class="flex flex-col h-full bg-neutral-900 group-hover:bg-black transition-all rounded-2xl p-4 md:p-5 border border-neutral-800 shadow-xl relative overflow-hidden">
          <div class="absolute -right-6 -top-6 w-24 h-24 bg-white/5 rounded-full blur-xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
          <div class="relative z-10">
            <h4 class="text-[10px] md:text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Чистий дохід</h4>
            <div class="text-xl md:text-3xl font-extrabold text-white">{{ netDifference | currency:userCurrency:'symbol-narrow':'1.0-0' }}</div>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .analytics-card {
      /* Optional wrapper styles */
    }
  `]
})
export class MonthAnalyticsComponent {
  financeData = inject(FinanceDataService);

  get userCurrency() {
    return this.financeData.userSettings().currency;
  }

  get factTotal() {
    return this.financeData.getMonthlyIncomeFactTotal();
  }

  get expensesTotal() {
    return this.financeData.getTotalExpensesThisMonth();
  }

  get taxAmount() {
    return this.financeData.getTaxAmount();
  }

  get taxRate() {
    return this.financeData.userSettings().taxRate || 0;
  }

  get netDifference() {
    return this.factTotal - this.expensesTotal - this.taxAmount;
  }
}

import { Component, inject, computed } from '@angular/core';
import { FinanceDataService, ExpensePlan } from '../../../services/finance-data.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-month-plan',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
      
      <!-- Income Plans -->
      <div class="card-container border-t-4 border-t-neutral-900 flex flex-col h-full">
        <h3 class="text-lg md:text-xl font-bold text-slate-800 mb-4 md:mb-6">План доходів</h3>
        <div class="space-y-4 mb-auto">
          <div *ngFor="let p of computedIncomePlans()" class="p-3 bg-slate-50 rounded-xl">
            <div class="flex justify-between items-start mb-2">
              <span class="font-bold text-slate-700 text-xs md:text-sm">{{ p.category }}</span>
              <div class="text-right">
                <div class="text-[10px] md:text-xs text-slate-500 font-semibold whitespace-nowrap">
                  {{ p.factAmount | currency:userCurrency:'symbol-narrow':'1.0-0' }} / {{ p.planAmount | currency:userCurrency:'symbol-narrow':'1.0-0' }}
                </div>
                <div class="text-xs md:text-sm font-bold text-emerald-600 mt-0.5">
                  {{ p.planAmount ? (p.factAmount / p.planAmount * 100) : 0 | number:'1.0-0' }}%
                </div>
              </div>
            </div>
            <div class="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div class="h-full bg-emerald-500 transition-all duration-500" [style.width.%]="p.planAmount ? (p.factAmount / p.planAmount * 100) : 0"></div>
            </div>
          </div>
        </div>
        
        <div class="pt-4 mt-4 border-t-2 border-slate-100 flex justify-between items-center mt-auto">
           <span class="text-sm font-bold text-slate-500 uppercase tracking-widest">Разом</span>
           <div class="text-right">
              <div class="text-base font-bold text-slate-800">{{ totalIncomeFact() | currency:userCurrency:'symbol-narrow':'1.0-0' }} / {{ totalIncomePlan() | currency:userCurrency:'symbol-narrow':'1.0-0' }}</div>
           </div>
        </div>
      </div>

      <!-- Expense Plans -->
      <div class="card-container border-t-4 border-t-neutral-800 flex flex-col h-full">
        <h3 class="text-lg md:text-xl font-bold text-slate-800 mb-4 md:mb-6">План витрат</h3>
        <div class="space-y-4 mb-auto">
          <div *ngFor="let p of computedExpensePlans()" class="p-3 bg-slate-50 rounded-xl">
            <div class="flex justify-between items-start mb-2">
              <span class="font-bold text-slate-700 text-xs md:text-sm">{{ p.category }}</span>
              <div class="text-right">
                <div class="text-[10px] md:text-xs text-slate-500 font-semibold whitespace-nowrap">
                  {{ p.factAmount | currency:userCurrency:'symbol-narrow':'1.0-0' }} / {{ p.amount | currency:userCurrency:'symbol-narrow':'1.0-0' }}
                </div>
                <!-- Optional overspending visual cue -->
                <div class="text-xs md:text-sm font-bold mt-0.5" [ngClass]="p.amount && p.factAmount > p.amount ? 'text-rose-600' : 'text-slate-600'">
                  {{ p.amount ? (p.factAmount / p.amount * 100) : 0 | number:'1.0-0' }}%
                </div>
              </div>
            </div>
            <div class="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div class="h-full transition-all duration-500" 
                   [ngClass]="p.amount && p.factAmount > p.amount ? 'bg-rose-500' : 'bg-slate-800'"
                   [style.width.%]="p.amount ? Math.min(p.factAmount / p.amount * 100, 100) : 0"></div>
            </div>
          </div>
        </div>
        
        <div class="pt-4 mt-4 border-t-2 border-slate-100 flex justify-between items-center mt-auto">
           <span class="text-sm font-bold text-slate-500 uppercase tracking-widest">Разом</span>
           <div class="text-right">
              <div class="text-base font-bold text-slate-800">{{ totalExpenseFact() | currency:userCurrency:'symbol-narrow':'1.0-0' }} / {{ totalExpensePlan() | currency:userCurrency:'symbol-narrow':'1.0-0' }}</div>
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
      border: 1px solid rgba(255,255,255,0.6);
    }
    @media (min-width: 768px) {
      .card-container {
        padding: 1.5rem;
      }
    }
    :host {
      display: block;
      height: 100%;
    }
  `]
})
export class MonthPlanComponent {
  Math = Math;
  financeData = inject(FinanceDataService);

  get userCurrency() {
    return this.financeData.userSettings().currency;
  }

  computedIncomePlans = computed(() => {
    const activeMonth = new Date().getMonth();
    const activeYear = new Date().getFullYear();
    const txs = this.financeData.transactions().filter(t => t.type === 'income' && t.date.getMonth() === activeMonth && t.date.getFullYear() === activeYear);

    return this.financeData.incomePlans().map(plan => {
      // Find matching tag or category
      const matched = txs.filter(t => t.tags.includes(plan.category) || t.title.toLowerCase().includes(plan.category.toLowerCase()));
      const fact = matched.reduce((acc, t) => acc + t.amountUah, 0);
      return { ...plan, factAmount: fact };
    });
  });

  computedExpensePlans = computed(() => {
    const activeMonth = new Date().getMonth();
    const activeYear = new Date().getFullYear();
    const txs = this.financeData.transactions().filter(t => t.type === 'expense' && t.date.getMonth() === activeMonth && t.date.getFullYear() === activeYear);
    const taxTotal = this.financeData.getMonthlyIncomeFactTotal() * 0.1; // Special mapping for automatic calculation of 10% taxes

    return this.financeData.expensePlans().map(plan => {
      let fact = 0;
      if (plan.category.toLowerCase().includes('податки')) {
        fact = taxTotal;
      } else {
        const matched = txs.filter(t => t.tags.includes(plan.category) || t.title.toLowerCase().includes(plan.category.toLowerCase()));
        fact = matched.reduce((acc, t) => acc + t.amountUah, 0);
      }
      return { ...plan, factAmount: fact };
    });
  });

  totalIncomeFact = computed(() => this.computedIncomePlans().reduce((acc, p) => acc + p.factAmount, 0));
  totalIncomePlan = computed(() => this.computedIncomePlans().reduce((acc, p) => acc + p.planAmount, 0));

  totalExpenseFact = computed(() => this.computedExpensePlans().reduce((acc, p) => acc + p.factAmount, 0));
  totalExpensePlan = computed(() => this.computedExpensePlans().reduce((acc, p) => acc + p.amount, 0));
}

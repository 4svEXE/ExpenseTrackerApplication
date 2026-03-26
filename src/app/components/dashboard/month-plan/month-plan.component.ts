import { Component, inject, computed, signal, OnInit } from '@angular/core';
import { FinanceDataService, ExpensePlan } from '../../../services/finance-data.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-month-plan',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="flex justify-end mb-4 md:mb-6">
       <button (click)="toggleCollapse()" class="text-xs font-bold text-slate-500 hover:text-black flex items-center gap-2 transition-colors">
          {{ isCollapsed() ? 'Розгорнути бюджет' : 'Згорнути бюджет' }}
          <i class="fa-solid" [ngClass]="isCollapsed() ? 'fa-chevron-down' : 'fa-chevron-up'"></i>
       </button>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 transition-all duration-300" 
         [ngClass]="isCollapsed() ? 'hidden' : 'grid'">
      
      <!-- Income Plans -->
      <div class="card-container border-t-4 border-t-neutral-900 flex flex-col h-full">
        <div class="flex justify-between items-center mb-4 md:mb-6">
          <h3 class="text-lg md:text-xl font-bold text-slate-800">План доходів</h3>
          <button routerLink="/wallets" class="text-emerald-600 hover:text-emerald-700 font-bold text-xs md:text-sm transition-colors">
            Додати
          </button>
        </div>
        <div class="space-y-4 mb-auto">
          <div *ngFor="let p of computedIncomePlans()" class="p-3 bg-slate-50 rounded-xl">
            <div class="flex justify-between items-start mb-2">
              <span class="font-bold text-slate-700 text-xs md:text-sm">{{ p.category }}</span>
              <div class="text-right">
                <div class="text-[10px] md:text-xs text-slate-500 font-semibold whitespace-nowrap">
                  {{ p.factAmount | currency:userCurrency:'symbol-narrow':'1.0-0' }} / {{ p.planAmount | currency:userCurrency:'symbol-narrow':'1.0-0' }}
                </div>
                <div class="text-xs md:text-sm font-bold text-emerald-600 mt-0.5">
                  {{ p.planAmount ? (p.factAmount / p.planAmount * 100) : 0 | number:'1.0-2' }}%
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
        <div class="flex justify-between items-center mb-4 md:mb-6">
          <h3 class="text-lg md:text-xl font-bold text-slate-800">План витрат</h3>
          <button routerLink="/wallets" class="text-indigo-600 hover:text-indigo-700 font-bold text-xs md:text-sm transition-colors">
            Додати
          </button>
        </div>
        <div class="space-y-4 mb-auto">
          <div *ngFor="let p of computedExpensePlans()" class="p-3 bg-slate-50 rounded-xl">
            <div class="flex justify-between items-start mb-2">
              <span class="font-bold text-slate-700 text-xs md:text-sm">{{ p.category }}</span>
              <div class="text-right">
                <div class="text-[10px] md:text-xs text-slate-500 font-semibold whitespace-nowrap">
                  {{ p.factAmount | currency:userCurrency:'symbol-narrow':'1.0-0' }} / {{ p.amount | currency:userCurrency:'symbol-narrow':'1.0-0' }}
                </div>
                <!-- Optional overspending visual cue -->
                <div class="text-xs md:text-sm font-bold mt-0.5 flex items-center justify-between" [ngClass]="p.amount && p.factAmount > p.amount ? 'text-rose-600' : 'text-slate-600'">
                  <span>{{ p.amount ? (p.factAmount / p.amount * 100) : 0 | number:'1.0-2' }}%</span>
                  <span *ngIf="p.amount && p.factAmount < p.amount" class="text-[9px] opacity-70">
                    Залишилось: {{ (p.amount - p.factAmount) | currency:userCurrency:'symbol-narrow':'1.0-0' }}
                  </span>
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
export class MonthPlanComponent implements OnInit {
  Math = Math;
  financeData = inject(FinanceDataService);

  isCollapsed = signal<boolean>(false);

  ngOnInit() {
    const saved = localStorage.getItem('isMonthPlanCollapsed');
    if (saved !== null) {
      this.isCollapsed.set(JSON.parse(saved));
    }
  }

  toggleCollapse() {
    this.isCollapsed.set(!this.isCollapsed());
    localStorage.setItem('isMonthPlanCollapsed', JSON.stringify(this.isCollapsed()));
  }

  get userCurrency() {
    return this.financeData.userSettings().currency;
  }

  computedIncomePlans = computed(() => this.financeData.getIncomePlansWithFact());

  computedExpensePlans = computed(() => {
    // 1. Regular Expense Plans
    const plans = this.financeData.getExpensePlansWithFact().filter(p => !(!p.isRecurring && p.factAmount >= p.amount));

    // 2. Add Active Subscriptions as plans
    const rate = this.financeData.getExchangeRate('UAH', this.financeData.userSettings().currency);
    const subs = this.financeData.subscriptions().map(s => {
      const priceInUserCurrency = s.priceUah * rate;
      return {
        id: s.id,
        category: `Sub: ${s.name}`,
        amount: priceInUserCurrency,
        factAmount: s.totalSpent > 0 ? priceInUserCurrency : 0,
        type: 'mandatory' as const,
        isRecurring: true
      };
    });

    return [...plans, ...subs];
  });

  totalIncomeFact = computed(() => this.computedIncomePlans().reduce((acc, p) => acc + p.factAmount, 0));
  totalIncomePlan = computed(() => this.computedIncomePlans().reduce((acc, p) => acc + p.planAmount, 0));

  totalExpenseFact = computed(() => this.computedExpensePlans().reduce((acc, p) => acc + p.factAmount, 0));
  totalExpensePlan = computed(() => this.computedExpensePlans().reduce((acc, p) => acc + p.amount, 0));
}

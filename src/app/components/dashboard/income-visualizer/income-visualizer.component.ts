import { Component, inject, effect, signal } from '@angular/core';
import { FinanceDataService } from '../../../services/finance-data.service';
import { CommonModule } from '@angular/common';

interface Segment {
  fillPercentage: number;
  color: string;
}

interface Bar {
  segments: Segment[];
}

@Component({
  selector: 'app-income-visualizer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="visualizer-container animate-fade-in p-6 bg-white/70 backdrop-blur-md rounded-3xl shadow-sm border border-white/40">
      
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h3 class="text-xl md:text-2xl font-black text-slate-800 tracking-tight flex flex-wrap items-center gap-3">
            Візуалізація доходів
          </h3>
          <p class="text-xs md:text-sm text-slate-500 font-medium mt-2">Кожна паличка — це {{ unitSize | number:'1.0-0' }} {{ userCurrencySymbol }}. Поділки — по {{ (unitSize / 4) | number:'1.0-0' }}.</p>
        </div>
        <div class="flex items-center gap-3 px-4 py-2 bg-slate-100/50 rounded-2xl border border-slate-200/60">
           <span class="text-[10px] font-bold text-slate-400 uppercase">Ціль (плани):</span>
           <span class="text-sm font-black text-slate-700">{{ planTotal | number:'1.0-0' }} {{ userCurrencySymbol }}</span>
        </div>
      </div>
      
      <div class="animate-in fade-in duration-300">
        <!-- Regular Income Bars -->
      <div class="space-y-4">
        <h4 class="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Планові надходження</h4>
        <div class="grid grid-cols-5 md:grid-cols-8 lg:grid-cols-10 gap-2 md:gap-3">
          <div *ngFor="let bar of bars; let i = index" class="bar-wrapper flex flex-col gap-1.5 min-w-0">
            <div class="bar-container flex h-7 md:h-9 rounded-xl overflow-hidden bg-slate-100/80 shadow-inner border border-slate-200/50">
              <div *ngFor="let seg of bar.segments" class="segment flex-1 border-r last:border-r-0 border-white/40 relative overflow-hidden">
                <div 
                  [style.backgroundColor]="seg.color"
                  [style.width]="seg.fillPercentage + '%'"
                  class="absolute left-0 top-0 h-full transition-all duration-700 ease-out shadow-[inset_-2px_0_4px_rgba(0,0,0,0.05)]">
                </div>
              </div>
            </div>
            <div class="text-center text-[9px] font-bold text-slate-400 mt-0.5">{{ (i + 1) * unitSize | number:'1.0-0' }}</div>
          </div>
        </div>
      </div>

      <!-- Extra Income Bars (Only visible if surplus exists) -->
      <div class="mt-10 space-y-4 pt-8 border-t border-slate-100 border-dashed" *ngIf="extraBars.length > 0">
        <div class="flex items-center gap-3">
          <h4 class="text-[10px] font-bold text-emerald-500 uppercase tracking-widest ml-1">Надлишкові доходи 🔥</h4>
          <div class="h-px bg-emerald-100 flex-1"></div>
        </div>
        <div class="grid grid-cols-5 md:grid-cols-8 lg:grid-cols-10 gap-2 md:gap-3">
          <div *ngFor="let bar of extraBars; let i = index" class="bar-wrapper flex flex-col gap-1.5 min-w-0 animate-in slide-in-from-bottom-2 duration-500">
            <div class="bar-container flex h-7 md:h-9 rounded-xl overflow-hidden bg-emerald-50/50 shadow-inner border border-emerald-100/50">
              <div *ngFor="let seg of bar.segments" class="segment flex-1 border-r last:border-r-0 border-white/40 relative overflow-hidden">
                <div 
                  [style.backgroundColor]="seg.color"
                  [style.width]="seg.fillPercentage + '%'"
                  class="absolute left-0 top-0 h-full transition-all duration-700 ease-out shadow-[inset_-2px_0_4px_rgba(255,255,255,0.2)]">
                </div>
              </div>
            </div>
            <div class="text-center text-[9px] font-bold text-emerald-400 mt-0.5">{{ (bars.length + i + 1) * unitSize | number:'1.0-0' }}</div>
          </div>
        </div>
      </div>
      
      <div class="mt-10 flex flex-wrap gap-6 py-4 px-6 bg-white/40 rounded-2xl border border-white/60">
        <div class="flex items-center gap-2.5">
          <span class="w-3.5 h-3.5 rounded-lg bg-[#10b981] shadow-sm shadow-emerald-200"></span> 
          <span class="text-xs font-bold text-slate-600">Здобутий дохід</span>
        </div>
        <div class="flex items-center gap-2.5">
          <span class="w-3.5 h-3.5 rounded-lg bg-[#fbbf24] shadow-sm shadow-amber-200"></span>
          <span class="text-xs font-bold text-slate-600">Витрати</span>
        </div>
        <div class="flex items-center gap-2.5">
          <span class="w-3.5 h-3.5 rounded-lg bg-slate-100 border border-slate-200"></span>
          <span class="text-xs font-bold text-slate-600">Заплановано</span>
        </div>
      </div>
      </div>
    </div>
  `,
  styles: [`
    .visualizer-container {
      background: rgba(255, 255, 255, 0.7);
      backdrop-filter: blur(10px);
      border-radius: 1.5rem;
      padding: 1.5rem;
      box-shadow: 0 10px 25px rgba(0,0,0,0.05);
      border: 1px solid rgba(255,255,255,0.4);
    }
  `]
})
export class IncomeVisualizerComponent {
  financeData = inject(FinanceDataService);
  bars: Bar[] = [];
  extraBars: Bar[] = [];

  constructor() {
    effect(() => {
      this.calculateBars();
    });
  }

  get userCurrencySymbol() {
    return this.financeData.getCurrencySymbol(this.financeData.userSettings().currency);
  }

  get unitSize() {
    return 1000;
  }

  get planTotal() {
    const plansTotal = this.financeData.getMonthlyIncomePlanTotal();
    if (plansTotal > 0) return plansTotal;

    const goalRaw = this.financeData.userSettings().monthlyIncomeGoal || 10000;
    const rateToUser = this.financeData.getExchangeRate('UAH', this.financeData.userSettings().currency);
    return goalRaw * rateToUser;
  }

  calculateBars() {
    const incomeGoal = this.planTotal;
    const unit = this.unitSize;
    const rateToUser = this.financeData.getExchangeRate('UAH', this.financeData.userSettings().currency);

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const totalActualIncome = this.financeData.transactions()
      .filter(t => t.type === 'income' && t.date.getMonth() === currentMonth && t.date.getFullYear() === currentYear)
      .reduce((acc, t) => acc + (t.amountUah * rateToUser), 0);

    // 1. Regular Bars (up to Goal)
    const numBarsRegular = Math.max(1, Math.ceil(incomeGoal / unit));
    this.bars = Array.from({ length: numBarsRegular }, () => ({
      segments: Array.from({ length: 4 }, () => ({ fillPercentage: 0, color: 'transparent' }))
    }));

    // 2. Extra Bars (Surplus)
    const surplus = Math.max(0, totalActualIncome - incomeGoal);
    const numBarsExtra = surplus > 0 ? Math.ceil(surplus / unit) : 0;
    this.extraBars = Array.from({ length: numBarsExtra }, () => ({
      segments: Array.from({ length: 4 }, () => ({ fillPercentage: 0, color: 'transparent' }))
    }));

    // 3. Fill Income (Regular + Extra)
    let remainingIncome = totalActualIncome;

    // Fill regular bars first
    for (let i = 0; i < numBarsRegular; i++) {
      for (let s = 0; s < 4; s++) {
        const amountToFill = Math.min(unit / 4, remainingIncome);
        if (amountToFill > 0) {
          this.bars[i].segments[s] = { fillPercentage: (amountToFill / (unit / 4)) * 100, color: '#10b981' };
          remainingIncome -= amountToFill;
        }
      }
    }

    // Fill extra bars if any income left
    for (let i = 0; i < numBarsExtra; i++) {
      for (let s = 0; s < 4; s++) {
        const amountToFill = Math.min(unit / 4, remainingIncome);
        if (amountToFill > 0) {
          this.extraBars[i].segments[s] = { fillPercentage: (amountToFill / (unit / 4)) * 100, color: '#10b981' };
          remainingIncome -= amountToFill;
        }
      }
    }

    // 4. Overlay Expenses
    const expenses = this.financeData.transactions()
      .filter(t => t.type === 'expense' && t.date.getMonth() === currentMonth && t.date.getFullYear() === currentYear);

    let expenseOffset = 0;
    for (const exp of expenses) {
      let remainingExp = exp.amountUah * rateToUser;
      const expColor = exp.expenseColor || '#fbbf24';

      while (remainingExp > 0) {
        const barIdxTotal = Math.floor(expenseOffset / unit);
        const segIdx = Math.floor((expenseOffset % unit) / (unit / 4));

        let targetBar: Bar | null = null;
        if (barIdxTotal < numBarsRegular) {
          targetBar = this.bars[barIdxTotal];
        } else if (barIdxTotal < numBarsRegular + numBarsExtra) {
          targetBar = this.extraBars[barIdxTotal - numBarsRegular];
        }

        if (!targetBar) break;

        const filledInCurrentSeg = expenseOffset % (unit / 4);
        const availableInSeg = (unit / 4) - filledInCurrentSeg;
        const fillThisStep = Math.min(remainingExp, availableInSeg);
        const newPercentage = ((filledInCurrentSeg + fillThisStep) / (unit / 4)) * 100;

        targetBar.segments[segIdx].color = expColor;
        targetBar.segments[segIdx].fillPercentage = Math.max(
          targetBar.segments[segIdx].fillPercentage,
          newPercentage
        );

        remainingExp -= fillThisStep;
        expenseOffset += fillThisStep;
      }
    }
  }
}

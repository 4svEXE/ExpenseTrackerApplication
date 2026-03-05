import { Component, inject, effect } from '@angular/core';
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
    <div class="visualizer-container">
      <h3 class="text-xl font-bold mb-4 drop-shadow-md text-slate-800">Візуалізація доходів та витрат</h3>
      <p class="text-sm text-slate-500 mb-6">Кожна паличка — це 1000 одиниць. Поділки — по 250 одиниць.</p>
      
      <div class="grid grid-cols-5 md:flex md:flex-wrap gap-2 md:gap-3 lg:gap-4">
        <div *ngFor="let bar of bars; let i = index" class="bar-wrapper flex flex-col gap-1 w-full md:w-[75px] lg:w-[90px]">
          <!-- Visual Bar with 4 Segments -->
          <div class="bar-container flex h-6 md:h-8 rounded-md overflow-hidden bg-slate-100 shadow-inner border border-slate-200">
            <div *ngFor="let seg of bar.segments" class="segment flex-1 border-r last:border-r-0 border-white/50 relative overflow-hidden">
              <div 
                [style.height]="'100%'" 
                [style.backgroundColor]="seg.color"
                [style.width]="seg.fillPercentage + '%'"
                class="absolute left-0 top-0 transition-all duration-500">
              </div>
            </div>
          </div>
          <div class="text-center text-[9px] md:text-xs font-medium text-slate-400 mt-1 truncate">{{ (i + 1) * 1000 }}</div>
        </div>
      </div>
      
      <div class="mt-8 flex flex-wrap gap-4 text-xs md:text-sm font-medium">
        <div class="flex items-center gap-2">
          <span class="w-3 h-3 rounded-full bg-[#10b981]"></span> Здобутий дохід
        </div>
        <div class="flex items-center gap-2">
          <span class="w-3 h-3 rounded-full bg-[#f87171]"></span> Оренда
        </div>
        <div class="flex items-center gap-2">
          <span class="w-3 h-3 rounded-full bg-[#fbbf24]"></span> Їжа/Інші
        </div>
        <div class="flex items-center gap-2">
          <span class="w-3 h-3 rounded-full bg-slate-100 border border-slate-200"></span> План (не зароблено)
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

  constructor() {
    effect(() => {
      this.calculateBars();
    });
  }

  calculateBars() {
    const incomeGoal = this.financeData.userSettings().monthlyIncomeGoal;

    // Total Bars
    const numBarsTotal = Math.max(1, Math.ceil(incomeGoal / 1000));
    this.bars = Array.from({ length: numBarsTotal }, () => ({
      segments: Array.from({ length: 4 }, () => ({ fillPercentage: 0, color: 'transparent' }))
    }));

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    // 1. Fill Income (Green)
    let filledIncome = this.financeData.transactions()
      .filter(t => t.type === 'income' && t.date.getMonth() === currentMonth && t.date.getFullYear() === currentYear)
      .reduce((acc, t) => acc + t.amountUah, 0);

    for (let i = 0; i < numBarsTotal; i++) {
      for (let s = 0; s < 4; s++) {
        const amountToFill = Math.min(250, filledIncome);
        if (amountToFill > 0) {
          this.bars[i].segments[s] = {
            fillPercentage: (amountToFill / 250) * 100,
            color: '#10b981' // emerald-500 (Income)
          };
          filledIncome -= amountToFill;
        }
      }
    }

    // 2. Overlay Expenses
    const expenses = this.financeData.transactions()
      .filter(t => t.type === 'expense' && t.date.getMonth() === currentMonth && t.date.getFullYear() === currentYear);

    let expenseOffset = 0;
    for (const exp of expenses) {
      let remainingExp = exp.amountUah;
      const expColor = exp.expenseColor || '#fbbf24';

      while (remainingExp > 0) {
        const barIdx = Math.floor(expenseOffset / 1000);
        const segIdx = Math.floor((expenseOffset % 1000) / 250);

        if (barIdx >= numBarsTotal) break;

        const filledInCurrentSeg = expenseOffset % 250;
        const availableInSeg = 250 - filledInCurrentSeg;
        const fillThisStep = Math.min(remainingExp, availableInSeg);

        const newPercentage = ((filledInCurrentSeg + fillThisStep) / 250) * 100;

        // If a segment is fully overwriting an already existing valid percentage, taking the Max effectively paints the width logic correctly.
        this.bars[barIdx].segments[segIdx].color = expColor;
        this.bars[barIdx].segments[segIdx].fillPercentage = Math.max(
          this.bars[barIdx].segments[segIdx].fillPercentage,
          newPercentage
        );

        remainingExp -= fillThisStep;
        expenseOffset += fillThisStep;
      }
    }
  }
}

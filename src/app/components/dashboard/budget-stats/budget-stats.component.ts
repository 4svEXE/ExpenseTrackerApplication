import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FinanceDataService } from '../../../services/finance-data.service';

@Component({
  selector: 'app-budget-stats',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row gap-8">
      
      <!-- Radial Chart Section -->
      <div class="flex-1 flex flex-col items-center justify-center relative min-h-[220px]">
        <svg viewBox="0 0 100 100" class="w-48 h-48 md:w-56 md:h-56 transform -rotate-90">
          <!-- Background circle -->
          <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f1f5f9" stroke-width="8" />
          
          <!-- Segments -->
          <ng-container *ngFor="let seg of radialSegments(); let i = index">
            <circle cx="50" cy="50" r="40" fill="transparent" 
                    [attr.stroke]="seg.color" 
                    stroke-width="8"
                    [attr.stroke-dasharray]="seg.dashArray"
                    [attr.stroke-dashoffset]="seg.dashOffset"
                    stroke-linecap="round"
                    class="transition-all duration-1000 ease-out" />
          </ng-container>

          <!-- Inner shadow/glow -->
          <circle cx="50" cy="50" r="35" fill="white" class="shadow-inner" />
        </svg>
        
        <!-- Center Text -->
        <div class="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Всього витрачено</span>
          <span class="text-xl md:text-2xl font-black text-slate-800 mt-1">
            {{ totalSpent() | currency:userCurrency:'symbol-narrow':'1.0-0' }}
          </span>
          <div class="mt-1 px-2 py-0.5 bg-slate-100 rounded-full text-[9px] font-bold text-slate-500 uppercase">
             {{ monthName }}
          </div>
        </div>
      </div>

      <!-- Categories List -->
      <div class="flex-1 flex flex-col justify-center space-y-3">
        <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-1">Витрати за категоріями</h4>
        
        <div *ngIf="categoryStats().length === 0" class="text-center py-4 text-xs font-bold text-slate-400 italic">
          Транзакцій поки немає...
        </div>

        <div *ngFor="let cat of categoryStats()" class="group flex flex-col gap-1.5">
           <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                 <div class="w-2.5 h-2.5 rounded-full shadow-sm" [style.backgroundColor]="cat.color"></div>
                 <span class="text-xs font-bold text-slate-700 tracking-tight">{{ cat.name }}</span>
              </div>
              <div class="text-xs font-black text-slate-800">{{ cat.amount | currency:userCurrency:'symbol-narrow':'1.0-1' }}</div>
           </div>
           <!-- Micro Progress Bar -->
           <div class="h-1 bg-slate-50 rounded-full overflow-hidden border border-slate-100 group-hover:border-slate-200 transition-colors">
              <div class="h-full transition-all duration-700" [style.backgroundColor]="cat.color" [style.width]="cat.percentage + '%'"></div>
           </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    :host { display: block; }
    svg circle {
       transition: stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1);
    }
  `]
})
export class BudgetStatsComponent {
  financeData = inject(FinanceDataService);

  get userCurrency() {
    return this.financeData.userSettings().currency;
  }

  get monthName() {
    return new Date().toLocaleDateString('uk-UA', { month: 'long' });
  }

  totalSpent = computed(() => {
    return this.financeData.getTotalExpensesThisMonth();
  });

  categoryStats = computed(() => {
    const total = this.totalSpent();
    if (total === 0) return [];

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const expenses = this.financeData.transactions().filter(t => 
      t.type === 'expense' && 
      t.date.getMonth() === currentMonth && 
      t.date.getFullYear() === currentYear
    );

    const statsMap = new Map<string, { amount: number, color: string }>();
    const rateToUser = this.financeData.getExchangeRate('UAH', this.userCurrency);

    expenses.forEach(ex => {
      const catName = ex.category || 'Інше';
      const color = ex.expenseColor || '#6366f1';
      const existing = statsMap.get(catName) || { amount: 0, color };
      statsMap.set(catName, { 
        amount: existing.amount + (ex.amountUah * rateToUser),
        color: color
      });
    });

    return Array.from(statsMap.entries())
      .map(([name, data]) => ({
        name,
        amount: data.amount,
        color: data.color,
        percentage: (data.amount / total) * 100
      }))
      .sort((a, b) => b.amount - a.amount);
  });

  radialSegments = computed(() => {
    const stats = this.categoryStats();
    let currentOffset = 0;
    const circumference = 2 * Math.PI * 40; // r=40

    return stats.map(s => {
      const segmentLength = (s.percentage / 100) * circumference;
      const dashArray = `${segmentLength} ${circumference}`;
      const dashOffset = -currentOffset;
      currentOffset += segmentLength;

      return {
        ...s,
        dashArray,
        dashOffset: dashOffset.toString()
      };
    });
  });
}

import { Component, inject, signal, computed } from '@angular/core';
import { FinanceDataService } from '../../../services/finance-data.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-growth-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card-container flex flex-col h-full">
      <div class="flex justify-between items-start mb-4 md:mb-6">
        <div>
          <h3 class="text-lg md:text-xl font-bold text-slate-800 drop-shadow-sm">Динаміка фінансів</h3>
          
          <div class="flex items-center gap-3 mt-1 mb-2">
            <div class="flex items-center gap-2">
              <span class="flex items-center gap-1 text-[9px] md:text-[10px] text-slate-500 uppercase font-bold tracking-widest"><div class="w-2.5 h-2.5 rounded-sm bg-emerald-400"></div>Дохід</span>
              <span class="flex items-center gap-1 text-[9px] md:text-[10px] text-slate-500 uppercase font-bold tracking-widest"><div class="w-2.5 h-2.5 rounded-sm bg-rose-400"></div>Витрати</span>
            </div>
          </div>
          
          <!-- Month Toggle -->
          <div class="inline-flex bg-slate-100/80 p-1 rounded-xl shadow-inner mt-2">
            <button *ngFor="let option of periodOptions" 
                    (click)="selectedPeriod.set(option)"
                    class="px-3 md:px-4 py-1.5 rounded-lg text-xs font-bold transition-all relative z-10"
                    [ngClass]="selectedPeriod() === option ? 'bg-white text-black shadow-sm' : 'text-slate-500 hover:text-slate-800'">
              {{ option }} міс.
            </button>
          </div>
        </div>
        <div class="text-right whitespace-nowrap">
          <div class="text-[10px] md:text-xs text-slate-500 mb-1 font-bold tracking-wider uppercase">Чистий прибуток</div>
          <div class="text-xl md:text-2xl font-bold leading-none" [ngClass]="growthPercentage() >= 0 ? 'text-emerald-500' : 'text-rose-500'">
            {{ growthPercentage() > 0 ? '+' : '' }}{{ growthPercentage() | number:'1.0-1' }}%
          </div>
          <div class="text-[9px] md:text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-1">Порівняно з минулим<br>місяцем</div>
        </div>
      </div>
      
      <!-- Chart -->
      <div class="flex items-end gap-1 md:gap-2 h-32 md:h-48 mt-auto pt-8">
        <div *ngFor="let month of financialHistory(); let last = last" class="flex flex-col items-center flex-1 group gap-1">
          <div class="flex items-end gap-0.5 md:gap-1 w-full h-full relative justify-center">
            
            <!-- Income bar -->
            <div 
              class="w-1/2 rounded-t-sm transition-all relative"
              [ngClass]="last ? 'bg-emerald-500 shadow-[0_4px_12px_rgba(16,185,129,0.3)]' : 'bg-emerald-200 group-hover:bg-emerald-400'"
              [style.height.%]="maxValue() > 0 ? (month.income / maxValue() * 100) : 0"
              [style.min-height.px]="month.income > 0 ? 6 : 2"
            ></div>
            
            <!-- Expense bar -->
            <div 
              class="w-1/2 rounded-t-sm transition-all relative"
              [ngClass]="last ? 'bg-rose-500 shadow-[0_4px_12px_rgba(244,63,94,0.3)]' : 'bg-rose-200 group-hover:bg-rose-400'"
              [style.height.%]="maxValue() > 0 ? (month.expense / maxValue() * 100) : 0"
              [style.min-height.px]="month.expense > 0 ? 6 : 2"
            ></div>

            <!-- Net Difference Tooltip -->
            <div 
              class="absolute -top-7 left-1/2 -translate-x-1/2 flex flex-col items-center transition-opacity z-20 pointer-events-none"
              [ngClass]="(selectedPeriod() > 6 && !last) ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'"
            >
               <span 
                 class="text-[9px] md:text-xs font-bold whitespace-nowrap px-1.5 py-0.5 rounded-md shadow-sm"
                 [ngClass]="month.net > 0 ? 'text-emerald-700 bg-emerald-100' : (month.net < 0 ? 'text-rose-700 bg-rose-100' : 'text-slate-500 bg-slate-100')"
               >
                 {{ month.net > 0 ? '+' : '' }}{{ month.netK }}k
               </span>
            </div>
          </div>
          
          <div 
            class="mt-1 text-[8px] md:text-[10px] font-semibold whitespace-nowrap truncate w-full text-center"
            [ngClass]="last ? 'text-slate-900 font-bold' : 'text-slate-400'"
          >
            <!-- Condense label on 12-month views -->
            {{ selectedPeriod() === 12 ? month.label.split(' ')[0] : month.label }}
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .card-container {
      background: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(12px);
      border-radius: 1.5rem;
      padding: 1.5rem;
      box-shadow: 0 10px 25px rgba(0,0,0,0.05);
      border: 1px solid rgba(255,255,255,0.5);
    }
    :host {
      display: block;
      height: 100%;
    }
  `]
})
export class GrowthChartComponent {
  financeData = inject(FinanceDataService);

  periodOptions = [3, 6, 12];
  selectedPeriod = signal(6);

  financialHistory = computed(() => {
    return this.financeData.getFinancialHistory(this.selectedPeriod());
  });

  growthPercentage = computed(() => {
    return this.financeData.getNetGrowthPercentage() || 0;
  });

  maxValue = computed(() => {
    const history = this.financialHistory();
    const incomes = history.map(m => m.income);
    const expenses = history.map(m => m.expense);
    return Math.max(...incomes, ...expenses, 100);
  });
}

import { Component, inject, signal, computed, effect } from '@angular/core';
import { FinanceDataService } from '../../../services/finance-data.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-growth-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card-container flex flex-col h-full bg-white/80 backdrop-blur-xl border border-white/40 rounded-[2rem] p-6 shadow-xl relative overflow-hidden">
      <!-- Background Glow -->
      <div class="absolute -right-20 -top-20 w-64 h-64 bg-emerald-100/30 rounded-full blur-[80px] pointer-events-none"></div>

      <div class="flex justify-between items-start mb-6 relative z-10">
        <div>
          <h3 class="text-xl font-black text-slate-800 tracking-tight">Динаміка фінансів</h3>
          
          <div class="flex items-center gap-4 mt-2 mb-4">
            <div class="flex items-center gap-2">
              <span class="flex items-center gap-1 text-[10px] text-slate-400 uppercase font-black tracking-widest">
                <div class="w-3 h-3 rounded-md bg-emerald-500 shadow-sm shadow-emerald-200"></div> Дохід
              </span>
              <span class="flex items-center gap-1 text-[10px] text-slate-400 uppercase font-black tracking-widest ml-1">
                <div class="w-3 h-3 rounded-md bg-rose-500 shadow-sm shadow-rose-200"></div> Витрати
              </span>
            </div>
          </div>
          
          <!-- Month Toggle -->
          <div class="inline-flex bg-slate-100/80 p-1.5 rounded-2xl shadow-inner ring-1 ring-black/5">
            <button *ngFor="let option of periodOptions" 
                    (click)="selectedPeriod.set(option)"
                    class="px-4 py-1.5 rounded-xl text-[11px] font-black tracking-wide transition-all duration-300"
                    [ngClass]="selectedPeriod() === option ? 'bg-white text-black shadow-md scale-105' : 'text-slate-500 hover:text-slate-800'">
              {{ option === 12 ? 'Рік' : option + ' міс.' }}
            </button>
          </div>
        </div>

        <div class="text-right">
          <div class="text-[10px] text-slate-400 font-black tracking-widest uppercase mb-1">Чистий ріст</div>
          <div class="text-3xl font-black leading-tight flex items-center justify-end" 
               [ngClass]="growthValue() >= 0 ? 'text-emerald-500' : 'text-rose-500'">
            <i class="fa-solid mr-1.5 text-xl" [ngClass]="growthValue() >= 0 ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'"></i>
            {{ growthValue() > 0 ? '+' : '' }}{{ growthValue() | number:'1.0-1' }}%
          </div>
          <p class="text-[10px] text-slate-400 font-bold">vs минулий місяць</p>
        </div>
      </div>
      
      <!-- Chart Area -->
      <div class="relative h-48 md:h-64 mt-4 w-full px-2">
        <!-- Grid horizontal lines -->
        <div class="absolute inset-x-0 top-0 bottom-8 flex flex-col justify-between pointer-events-none opacity-50">
          <div *ngFor="let i of [1,2,3,4,5]" class="w-full h-px border-t border-dashed border-slate-200"></div>
        </div>

        <div class="flex items-end gap-1.5 md:gap-4 h-full relative z-10">
          <div *ngFor="let month of history(); let last = last" 
               class="flex flex-col items-center flex-1 h-full min-w-0">
            
            <!-- Bar Stack -->
            <div class="flex-1 w-full flex items-end justify-center gap-0.5 md:gap-1 relative group py-2">
              
              <!-- Growth Indicator Popover -->
              <div class="absolute -top-10 left-1/2 -translate-x-1/2 z-30 transition-all duration-500 pointer-events-none"
                   [ngClass]="last ? 'opacity-100 scale-100' : 'opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-105'">
                <div class="px-2 py-1 rounded-xl shadow-2xl border border-white/50 backdrop-blur-md whitespace-nowrap"
                     [ngClass]="month.net >= 0 ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'">
                  <div class="text-[9px] font-black leading-none">{{ month.netK }}k</div>
                  <div class="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 rotate-45"
                       [ngClass]="month.net >= 0 ? 'bg-emerald-500' : 'bg-rose-500'"></div>
                </div>
              </div>

              <!-- Income Bar -->
              <div class="w-[30%] md:w-5 rounded-t-[4px] rounded-b-sm bg-gradient-to-b from-emerald-400 to-emerald-600 transition-all duration-700 ease-out shadow-lg shadow-emerald-500/10"
                   [style.height.%]="getBarHeight(month.income)"
                   [style.min-height.px]="month.income > 0 ? 6 : 0">
                 <div class="w-full h-full bg-white/20 rounded-t-[3px] animate-pulse-slow"></div>
              </div>
              
              <!-- Expense Bar -->
              <div class="w-[30%] md:w-5 rounded-t-[4px] rounded-b-sm bg-gradient-to-b from-rose-400 to-rose-600 transition-all duration-700 ease-out shadow-lg shadow-rose-500/10"
                   [style.height.%]="getBarHeight(month.expense)"
                   [style.min-height.px]="month.expense > 0 ? 6 : 0">
                 <div class="w-full h-full bg-white/20 rounded-t-[3px]"></div>
              </div>

            </div>

            <!-- Month Label -->
            <div class="h-8 flex items-center">
              <span class="text-[9px] font-black uppercase tracking-tighter" 
                    [ngClass]="last ? 'text-slate-900 scale-110' : 'text-slate-400'">
                {{ month.label }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .animate-pulse-slow {
      animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.6; }
    }
    .bubble-float {
      animation: float 3s ease-in-out infinite;
    }
    @keyframes float {
      0%, 100% { transform: translate(-50%, 0); }
      50% { transform: translate(-50%, -5px); }
    }
  `]
})
export class GrowthChartComponent {
  private financeData = inject(FinanceDataService);

  periodOptions = [3, 6, 12];
  selectedPeriod = signal(Number(localStorage.getItem('chart_period')) || 12);

  constructor() {
    effect(() => {
      localStorage.setItem('chart_period', this.selectedPeriod().toString());
    });
  }

  history = computed(() => {
    return this.financeData.getFinancialHistory(this.selectedPeriod());
  });

  growthValue = computed(() => {
    return this.financeData.getNetGrowthPercentage() || 0;
  });

  private maxVal = computed(() => {
    const h = this.history();
    const peak = Math.max(...h.map(m => Math.max(m.income, m.expense)), 100);
    return peak * 1.2;
  });

  getBarHeight(val: number): number {
    const mv = this.maxVal();
    if (mv === 0 || isNaN(mv)) return 0;
    const h = (val / mv) * 100;
    return Math.min(100, Math.max(0, h));
  }
}

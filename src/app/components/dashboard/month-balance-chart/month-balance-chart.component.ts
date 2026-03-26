import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FinanceDataService } from '../../../services/finance-data.service';

@Component({
  selector: 'app-month-balance-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card-container flex flex-col h-full bg-slate-50 border border-slate-100/60 rounded-3xl p-4 md:p-6 mt-4 md:mt-8">
       <div class="mb-4">
         <h4 class="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
            <i class="fa-solid fa-chart-line text-indigo-500"></i> Тренд балансу за місяць
         </h4>
         <p class="text-[10px] md:text-xs font-bold text-slate-400 mt-1">Зміни балансу: фактичні (до сьогодні) та очікувані (після)</p>
       </div>
       
       <div class="flex-1 w-full min-h-[200px] relative">
          <!-- SVG Graph -->
          <svg class="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
             <!-- Zero Line -->
             <line x1="0" [attr.y1]="zeroY()" x2="100" [attr.y2]="zeroY()" stroke="#cbd5e1" stroke-width="0.5" stroke-dasharray="2,2" />
             
             <!-- Gradient Area -->
             <defs>
               <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                 <stop offset="0%" stop-color="#818cf8" stop-opacity="0.3" />
                 <stop offset="100%" stop-color="#818cf8" stop-opacity="0.0" />
               </linearGradient>
             </defs>
             
             <polygon [attr.points]="polyPoints()" fill="url(#balanceGradient)" />
             <polyline [attr.points]="linePoints()" fill="none" class="stroke-indigo-500" stroke-width="1.5" stroke-linejoin="round" />
             
             <!-- Today Line -->
             <line [attr.x1]="todayX()" y1="0" [attr.x2]="todayX()" y2="100" stroke="#f43f5e" stroke-width="0.5" stroke-dasharray="2,2" />
             
             <!-- Points -->
             <circle *ngFor="let p of pointsArray(); let i = index" 
                     [attr.cx]="p.x" [attr.cy]="p.y" 
                     r="1.5"
                     [ngClass]="i + 1 <= todayIndex() ? 'fill-indigo-600' : 'fill-slate-300 stroke-slate-400'"
                     class="transition-all hover:r-3 cursor-pointer" />
          </svg>
       </div>
       
       <div class="flex justify-between items-center mt-3 px-1 text-[10px] font-bold text-slate-400">
          <span>1-ше число</span>
          <span class="text-rose-500">Сьогодні ({{todayIndex()}}-е)</span>
          <span>Кінець місяця</span>
       </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class MonthBalanceChartComponent {
  financeData = inject(FinanceDataService);

  today = new Date();
  
  chartData = computed(() => {
     const year = this.today.getFullYear();
     const month = this.today.getMonth();
     const daysInMonth = new Date(year, month + 1, 0).getDate();
     const todayDate = this.today.getDate();
     
     const actuals = this.financeData.transactions().filter(t => t.date.getMonth() === month && t.date.getFullYear() === year);
     const expected = this.financeData.expectedEvents().filter(e => new Date(e.date).getMonth() === month && new Date(e.date).getFullYear() === year);
     const subs = this.financeData.subscriptions();
     
     const userCurrency = this.financeData.userSettings().currency;
     const rate = this.financeData.getExchangeRate('UAH', userCurrency);
     
     let cumulative = 0;
     const dailyData = [];
     
     for (let d = 1; d <= daysInMonth; d++) {
        let net = 0;
        
        if (d <= todayDate) {
           const dayTrans = actuals.filter(t => t.date.getDate() === d);
           net += dayTrans.reduce((sum, t) => sum + (t.type === 'income' ? (t.amountUah * rate) : -(t.amountUah * rate)), 0);
        } else {
           const dayExp = expected.filter(e => new Date(e.date).getDate() === d);
           net += dayExp.reduce((sum, e) => {
              const r = this.financeData.getExchangeRate(e.currency || 'UAH', userCurrency);
              return sum + (e.type === 'income' ? e.amount * r : -e.amount * r);
           }, 0);
           
           const daySubs = subs.filter(s => new Date(s.nextPaymentDate).getDate() === d && new Date(s.nextPaymentDate).getMonth() === month);
           net -= daySubs.reduce((sum, s) => sum + (s.priceUah * rate), 0);
        }
        
        cumulative += net;
        dailyData.push(cumulative);
     }
     
     return dailyData;
  });

  minMax = computed(() => {
     const d = this.chartData();
     const min = Math.min(...d, 0);
     const max = Math.max(...d, 0);
     const range = max - min || 1;
     return { min: min - range * 0.1, max: max + range * 0.1, range: range * 1.2 };
  });

  zeroY = computed(() => {
     const { min, range } = this.minMax();
     return 100 - ((0 - min) / range) * 100;
  });

  todayX = computed(() => {
     const d = this.chartData().length;
     return ((this.today.getDate() - 1) / (d - 1)) * 100;
  });

  todayIndex = computed(() => this.today.getDate());

  pointsArray = computed(() => {
     const d = this.chartData();
     const { min, range } = this.minMax();
     return d.map((val, i) => {
        const x = (i / (d.length - 1)) * 100;
        const y = 100 - ((val - min) / range) * 100;
        return { x, y, val };
     });
  });

  linePoints = computed(() => {
     return this.pointsArray().map(p => `${p.x},${p.y}`).join(' ');
  });

  polyPoints = computed(() => {
     const pts = this.pointsArray();
     if (pts.length === 0) return '';
     const zY = this.zeroY();
     return `0,${zY} ${this.linePoints()} 100,${zY}`;
  });
}

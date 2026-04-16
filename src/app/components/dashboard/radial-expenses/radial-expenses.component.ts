import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FinanceDataService } from '../../../services/finance-data.service';

interface CategoryScore {
  category: string;
  amount: number;
  color: string;
  percentage: number;
  startAngle: number;
  endAngle: number;
}

@Component({
  selector: 'app-radial-expenses',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card-container flex flex-col h-full bg-white/80 backdrop-blur-xl border border-white/40 rounded-[2rem] p-6 shadow-xl relative overflow-hidden">
      <!-- Background Glow -->
      <div class="absolute -left-20 -bottom-20 w-64 h-64 bg-indigo-100/30 rounded-full blur-[80px] pointer-events-none"></div>

      <div class="flex justify-between items-start mb-6 relative z-10">
        <div>
          <h3 class="text-xl font-black text-slate-800 tracking-tight">Розподіл витрат</h3>
          <p class="text-[10px] text-slate-400 font-black tracking-widest uppercase mt-1">за поточний місяць</p>
        </div>
        <div class="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500">
           <i class="fa-solid fa-chart-pie"></i>
        </div>
      </div>

      <div class="flex flex-col md:flex-row items-center gap-8 relative z-10">
        <!-- SVG Donut Chart -->
        <div class="relative w-48 h-48 flex-shrink-0">
          <svg viewBox="0 0 100 100" class="w-full h-full -rotate-90">
            <!-- Background track -->
            <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f1f5f9" stroke-width="12" />
            
            <!-- Category Segments -->
            <circle *ngFor="let seg of segments()"
                    cx="50" cy="50" r="40"
                    fill="transparent"
                    [attr.stroke]="seg.color"
                    stroke-width="12"
                    stroke-linecap="round"
                    [attr.stroke-dasharray]="getDashArray(seg.percentage)"
                    [attr.stroke-dashoffset]="getDashOffset(seg.startAngle)"
                    class="transition-all duration-1000 ease-out" />
          </svg>
          
          <!-- Center Text -->
          <div class="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Всього</span>
            <span class="text-lg font-black text-slate-800">{{ totalExpenses() | number:'1.0-0' }}</span>
            <span class="text-[10px] font-black text-slate-500">{{ userCurrency() }}</span>
          </div>
        </div>

        <!-- Legend -->
        <div class="flex-1 w-full space-y-3">
          <div *ngFor="let seg of segments().slice(0, 5)" class="flex items-center justify-between group">
            <div class="flex items-center gap-3">
              <div class="w-3 h-3 rounded-full" [style.background-color]="seg.color"></div>
              <span class="text-sm font-bold text-slate-700 group-hover:text-black transition-colors">{{ seg.category }}</span>
            </div>
            <div class="text-right">
              <span class="text-xs font-black text-slate-900 block">{{ seg.amount | number:'1.0-0' }} {{ userCurrency() }}</span>
              <span class="text-[9px] font-bold text-slate-400 uppercase">{{ seg.percentage | number:'1.0-0' }}%</span>
            </div>
          </div>
          
          <div *ngIf="segments().length > 5" class="pt-2 border-t border-slate-100 mt-2">
             <p class="text-[10px] text-slate-400 font-bold uppercase text-center italic">+ ще {{ segments().length - 5 }} категорій</p>
          </div>
          
          <div *ngIf="segments().length === 0" class="flex flex-col items-center justify-center py-8 text-center">
             <div class="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-2">
                <i class="fa-solid fa-folder-open text-xl"></i>
             </div>
             <p class="text-xs font-bold text-slate-400">Немає витрат за цей місяць</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    svg circle {
      transition: stroke-dasharray 1s ease-out, stroke-dashoffset 1s ease-out;
    }
  `]
})
export class RadialExpensesComponent {
  private financeData = inject(FinanceDataService);

  userCurrency = computed(() => this.financeData.userSettings().currency);

  totalExpenses = computed(() => {
    return this.financeData.getTotalExpensesThisMonth();
  });

  segments = computed(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const txs = this.financeData.transactions().filter(t => 
      t.type === 'expense' && 
      t.date.getMonth() === currentMonth && 
      t.date.getFullYear() === currentYear
    );

    const grouped: Record<string, number> = {};
    const rate = this.financeData.getExchangeRate('UAH', this.userCurrency());

    txs.forEach(t => {
      const cat = t.category || 'Інше';
      const amt = (t.amountUah || 0) * rate;
      grouped[cat] = (grouped[cat] || 0) + amt;
    });

    const total = Object.values(grouped).reduce((s, a) => s + a, 0);
    if (total === 0) return [];

    const sorted = Object.entries(grouped)
      .sort((a, b) => b[1] - a[1]);

    const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#06b6d4', '#475569'];
    
    let currentAngle = 0;
    return sorted.map(([cat, amt], i) => {
      const percentage = (amt / total) * 100;
      const seg = {
        category: cat,
        amount: amt,
        color: colors[i % colors.length],
        percentage: percentage,
        startAngle: currentAngle,
        endAngle: currentAngle + percentage
      };
      currentAngle += percentage;
      return seg;
    });
  });

  getDashArray(percentage: number): string {
    const circumference = 2 * Math.PI * 40;
    const value = (percentage / 100) * circumference;
    return `${value} ${circumference}`;
  }

  getDashOffset(startAngle: number): number {
    const circumference = 2 * Math.PI * 40;
    return -(startAngle / 100) * circumference;
  }
}

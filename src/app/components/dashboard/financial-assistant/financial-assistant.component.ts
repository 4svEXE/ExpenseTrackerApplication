import { Component, inject } from '@angular/core';
import { FinanceDataService } from '../../../services/finance-data.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-financial-assistant',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="assistant-card relative overflow-hidden text-white flex justify-between items-center">
      <!-- Background decorators -->
      <div class="absolute -top-10 -right-10 w-40 h-40 bg-white/20 rounded-full blur-2xl"></div>
      <div class="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-2xl"></div>

      <div class="relative z-10 w-full">
        <h2 class="text-2xl md:text-3xl font-extrabold mb-1 tracking-tight text-white flex items-center gap-3">
          <div *ngIf="financeData.userSettings().avatarUrl" 
               class="w-10 h-10 md:w-12 md:h-12 rounded-2xl border-2 border-white/20 shadow-xl overflow-hidden flex items-center justify-center bg-white/10 cursor-pointer hover:scale-105 active:scale-95 transition-all"
               routerLink="/settings">
            <img [src]="financeData.userSettings().avatarUrl" alt="U" class="w-full h-full object-cover" />
          </div>
          <i class="fa-solid fa-user-circle opacity-50" *ngIf="!financeData.userSettings().avatarUrl"></i>
          Привіт, {{ userName }}!
        </h2>
        <p class="text-neutral-400 text-xs md:text-sm font-medium opacity-90 mb-4">{{ currentDate | date:'fullDate':'':'uk-UA' }}</p>
        
        <div class="flex flex-col md:flex-row md:items-center gap-4 md:gap-8 mt-6">
          <div class="stats-item">
            <div class="text-neutral-400 text-[10px] md:text-xs mb-1 uppercase tracking-wider font-semibold">Баланс Карток</div>
            <div class="text-3xl md:text-4xl font-bold text-white">{{ totalBalance | currency:userCurrency:'symbol-narrow':'1.0-0' }}</div>
          </div>
          <div class="hidden md:block h-12 w-px bg-white/10"></div>
          <div class="stats-item">
            <div class="text-neutral-400 text-[10px] md:text-xs mb-1 uppercase tracking-wider font-semibold">Зароблено за місяць</div>
            <div class="text-xl md:text-2xl font-semibold opacity-90 text-white">{{ factTotal | currency:userCurrency:'symbol-narrow':'1.0-0' }}</div>
          </div>
          <div class="hidden md:block h-12 w-px bg-white/10"></div>
          <div class="stats-item">
            <div class="text-neutral-400 text-[10px] md:text-xs mb-1 uppercase tracking-wider font-semibold">План на місяць</div>
            <div class="text-xl md:text-2xl font-semibold opacity-90 text-white">{{ planTotal | currency:userCurrency:'symbol-narrow':'1.0-0' }}</div>
          </div>
        </div>

        <div class="mt-8">
          <div class="flex justify-between text-xs md:text-sm font-bold text-white mb-2 uppercase tracking-wide">
            <span>Прогрес до мети</span>
            <span>{{ progressPercentage | number:'1.1-1' }}%</span>
          </div>
          <div class="h-3 w-full bg-white/20 rounded-full overflow-hidden backdrop-blur-sm border border-white/10">
            <div 
              class="h-full bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.6)] rounded-full transition-all duration-1000 ease-out"
              [style.width.%]="visualProgress"
            ></div>
          </div>
        </div>
      </div>
      
      <div class="relative z-10 hidden md:block opacity-90 drop-shadow-2xl">
        <svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-white/80"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/><path d="M18 19v-2"/></svg>
      </div>
    </div>
  `,
  styles: [`
    .assistant-card {
      background: linear-gradient(135deg, #18181b 0%, #000000 100%);
      border-radius: 1.5rem;
      padding: 1.25rem;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.25), 0 8px 10px -6px rgba(0, 0, 0, 0.2);
    }
    @media (min-width: 768px) {
      .assistant-card {
        padding: 2.5rem;
      }
    }
  `]
})
export class FinancialAssistantComponent {
  financeData = inject(FinanceDataService);
  currentDate = new Date();

  get userName() {
    return this.financeData.userSettings().name;
  }

  get userCurrency() {
    return this.financeData.userSettings().currency;
  }

  get planTotal() {
    const plansTotal = this.financeData.getMonthlyIncomePlanTotal();
    const goal = Number(this.financeData.userSettings().monthlyIncomeGoal) || 0;
    return Math.max(plansTotal, goal);
  }

  get factTotal() {
    return this.financeData.getMonthlyIncomeFactTotal();
  }

  get totalBalance() {
    return this.financeData.totalBalance();
  }

  get progressPercentage() {
    const p = this.planTotal;
    if (p === 0) return 0;
    return (this.factTotal / p) * 100;
  }

  get visualProgress() {
    return Math.min(this.progressPercentage, 100);
  }
}

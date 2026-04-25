import { Component, EventEmitter, Input, Output, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FinanceDataService } from '../../../services/finance-data.service';

@Component({
  selector: 'app-monthly-statement',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-md" (click)="close.emit()"></div>
      
      <!-- Content -->
      <div class="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        
        <!-- Header -->
        <div class="p-6 pb-4 flex items-center justify-between border-b border-slate-50">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl">
              <i class="fa-solid fa-file-invoice-dollar"></i>
            </div>
            <div>
              <h3 class="text-xl font-black text-slate-800">Виписка за місяць</h3>
              <div class="flex items-center gap-2 mt-1">
                <button (click)="prevMonth()" class="text-slate-400 hover:text-slate-600 transition-colors">
                  <i class="fa-solid fa-chevron-left text-xs"></i>
                </button>
                <span class="text-sm font-bold text-slate-600 min-w-[100px] text-center">
                  {{ displayDate | date:'LLLL yyyy':'':'uk-UA' }}
                </span>
                <button (click)="nextMonth()" class="text-slate-400 hover:text-slate-600 transition-colors">
                  <i class="fa-solid fa-chevron-right text-xs"></i>
                </button>
              </div>
            </div>
          </div>
          <button (click)="close.emit()" class="w-10 h-10 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors flex items-center justify-center">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <!-- Body -->
        <div class="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          
          <!-- Key Totals -->
          <div class="grid grid-cols-2 gap-4">
            <div class="p-4 rounded-3xl bg-emerald-50 border border-emerald-100">
              <span class="text-[10px] font-bold text-emerald-600 uppercase tracking-widest block mb-1">Отримано</span>
              <span class="text-xl font-black text-emerald-700">{{ stats().income | currency:userCurrency:'symbol-narrow':'1.0-0' }}</span>
            </div>
            <div class="p-4 rounded-3xl bg-rose-50 border border-rose-100">
              <span class="text-[10px] font-bold text-rose-600 uppercase tracking-widest block mb-1">Витрачено</span>
              <span class="text-xl font-black text-rose-700">{{ stats().expenses | currency:userCurrency:'symbol-narrow':'1.0-0' }}</span>
            </div>
          </div>

          <!-- Debts Section -->
          <div class="space-y-3">
            <h4 class="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Рух боргів</h4>
            <div class="p-5 rounded-3xl bg-slate-50 border border-slate-100 flex flex-col gap-4">
              <div class="flex justify-between items-center">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs">
                    <i class="fa-solid fa-arrow-down"></i>
                  </div>
                  <span class="text-sm font-bold text-slate-600">Взято в борг / Повернуто вам</span>
                </div>
                <span class="text-sm font-black text-emerald-600">+{{ stats().debtsReceived | number:'1.0-0' }}</span>
              </div>
              <div class="h-px bg-slate-200 w-full"></div>
              <div class="flex justify-between items-center">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-xs">
                    <i class="fa-solid fa-arrow-up"></i>
                  </div>
                  <span class="text-sm font-bold text-slate-600">Виплачено боргів / Позичено</span>
                </div>
                <span class="text-sm font-black text-rose-600">-{{ stats().debtsPaid | number:'1.0-0' }}</span>
              </div>
            </div>
          </div>

          <!-- Plans Section -->
          <div class="space-y-3">
            <h4 class="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Плановані витрати</h4>
            <div class="p-5 rounded-3xl bg-indigo-50/50 border border-indigo-100">
              <div class="flex justify-between items-center mb-4">
                <div>
                  <span class="text-2xl font-black text-slate-800">{{ stats().plannedCompleted | currency:userCurrency:'symbol-narrow':'1.0-0' }}</span>
                  <span class="text-xs font-bold text-slate-400 ml-2">з {{ stats().plannedTotal | number:'1.0-0' }}</span>
                </div>
                <div class="px-3 py-1 rounded-full bg-white text-[10px] font-black text-indigo-600 shadow-sm border border-indigo-50">
                  {{ (stats().plannedCompleted / (stats().plannedTotal || 1) * 100) | number:'1.0-0' }}%
                </div>
              </div>
              
              <!-- Progress Bar -->
              <div class="h-3 w-full bg-indigo-100 rounded-full overflow-hidden mb-4">
                <div class="h-full bg-indigo-500 rounded-full transition-all duration-1000" 
                     [style.width.%]="(stats().plannedCompleted / (stats().plannedTotal || 1) * 100)"></div>
              </div>

              <div class="flex justify-between items-center text-xs font-bold">
                <span class="text-slate-500">Залишилось сплатити:</span>
                <span class="text-indigo-600">{{ stats().plannedPending | currency:userCurrency:'symbol-narrow':'1.0-0' }}</span>
              </div>
            </div>
          </div>

        </div>

        <!-- Footer -->
        <div class="p-6 pt-2 bg-slate-50 border-t border-slate-100">
          <div class="flex justify-between items-center">
            <span class="text-sm font-bold text-slate-500">Чистий результат місяця:</span>
            <span class="text-xl font-black" [ngClass]="stats().net >= 0 ? 'text-emerald-600' : 'text-rose-600'">
              {{ stats().net >= 0 ? '+' : '' }}{{ stats().net | currency:userCurrency:'symbol-narrow':'1.0-0' }}
            </span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class MonthlyStatementComponent {
  @Output() close = new EventEmitter<void>();
  
  financeData = inject(FinanceDataService);
  viewDate = signal(new Date());

  get displayDate() {
    return this.viewDate();
  }

  get userCurrency() {
    return this.financeData.userSettings().currency;
  }

  stats = computed(() => {
    const d = this.viewDate();
    return this.financeData.getStatsForMonth(d.getMonth(), d.getFullYear());
  });

  prevMonth() {
    const d = this.viewDate();
    this.viewDate.set(new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }

  nextMonth() {
    const d = this.viewDate();
    this.viewDate.set(new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }
}

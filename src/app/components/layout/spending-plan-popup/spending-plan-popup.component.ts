import { Component, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FinanceDataService } from '../../../services/finance-data.service';

@Component({
    selector: 'app-spending-plan-popup',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="fixed inset-0 z-[1100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div class="bg-white rounded-[32px] w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in duration-300">
        <!-- Header -->
        <div class="p-6 bg-emerald-500 text-white relative">
          <div class="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <h3 class="text-xl font-black mb-1">План на місяць 📈</h3>
          <p class="text-emerald-100 text-xs font-medium uppercase tracking-wider">Ваші поточні плани витрат</p>
          
          <button (click)="close.emit()" class="absolute right-4 top-4 w-8 h-8 flex items-center justify-center rounded-full bg-black/10 hover:bg-black/20 transition-all text-white">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <!-- Body -->
        <div class="p-6">
          <div class="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            <div *ngFor="let plan of expensePlans()" class="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 group hover:border-indigo-200 transition-all">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-400 group-hover:text-indigo-500 border border-slate-50 transition-colors">
                  <i class="fa-solid fa-receipt"></i>
                </div>
                <div>
                  <p class="font-bold text-slate-800 text-sm">{{ plan.category }}</p>
                  <p class="text-[10px] text-slate-400 font-bold uppercase">{{ plan.type === 'mandatory' ? 'Обовʼязкове' : 'Мрія' }}</p>
                </div>
              </div>
              <div class="text-right">
                <p class="font-black text-slate-900">{{ plan.amount | currency:currency():'symbol-narrow':'1.0-0' }}</p>
              </div>
            </div>

            <div *ngIf="expensePlans().length === 0" class="text-center py-8">
              <div class="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-300">
                 <i class="fa-solid fa-ghost text-2xl"></i>
              </div>
              <p class="text-slate-400 text-sm font-bold">Планів поки немає...</p>
            </div>
          </div>

          <!-- Footer Action -->
          <button (click)="close.emit()" class="w-full mt-6 py-4 bg-black text-white rounded-2xl font-black shadow-xl shadow-black/10 hover:bg-neutral-800 active:scale-[0.98] transition-all">
            Зрозумів, дякую!
          </button>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
  `]
})
export class SpendingPlanPopupComponent {
    private financeData = inject(FinanceDataService);

    @Output() close = new EventEmitter<void>();

    expensePlans = this.financeData.expensePlans;
    currency = (() => this.financeData.userSettings().currency);
}

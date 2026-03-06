import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GamificationService } from '../../../services/gamification.service';
import { FinanceDataService } from '../../../services/finance-data.service';

@Component({
    selector: 'app-gamification-modal',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div *ngIf="gamificationService.isInfoModalOpen()" 
         class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-start justify-center pt-20 px-4"
         (click)="gamificationService.toggleInfoModal()">
      
      <div class="bg-white rounded-[2.5rem] w-full max-w-sm overflow-hidden shadow-2xl animate-pop-in relative"
           (click)="$event.stopPropagation()">
        
        <!-- Header -->
        <div class="bg-gradient-to-br from-amber-400 to-orange-500 p-8 text-white relative">
            <div class="absolute top-4 right-4 cursor-pointer" (click)="gamificationService.toggleInfoModal()">
                <i class="fa-solid fa-xmark text-xl opacity-60 hover:opacity-100"></i>
            </div>
            
            <div class="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4 shadow-xl border border-white/30">
                <i class="fa-solid fa-coins text-3xl"></i>
            </div>
            <h3 class="text-2xl font-black tracking-tight mb-1">Гейміфікація</h3>
            <p class="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Система магічних івентів</p>
        </div>

        <!-- Content -->
        <div class="p-8">
            <div class="space-y-6 mb-8">
                <div class="flex gap-4">
                    <div class="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0">
                        <i class="fa-solid fa-wand-magic-sparkles"></i>
                    </div>
                    <div>
                        <p class="text-sm font-black text-slate-800 mb-1">Випадкові пригоди</p>
                        <p class="text-xs font-bold text-slate-500 leading-relaxed">Кожні 4 години (або 5 секунд для "Богів") з'являється нова подія з вибором та наслідками.</p>
                    </div>
                </div>

                <div class="flex gap-4">
                    <div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
                        <i class="fa-solid fa-trophy"></i>
                    </div>
                    <div>
                        <p class="text-sm font-black text-slate-800 mb-1">Активні цілі</p>
                        <p class="text-xs font-bold text-slate-500 leading-relaxed">Виконуйте завдання (наприклад, додати витрату) та отримуйте монетки ETA.</p>
                    </div>
                </div>

                <div class="flex gap-4">
                    <div class="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                        <i class="fa-solid fa-shop"></i>
                    </div>
                    <div>
                        <p class="text-sm font-black text-slate-800 mb-1">Навіщо монетки?</p>
                        <p class="text-xs font-bold text-slate-500 leading-relaxed">Використовуйте їх для участі в івентах з високим ризиком або скіпайте час очікування.</p>
                    </div>
                </div>
            </div>

            <!-- Toggle UI -->
            <div class="bg-slate-50 rounded-3xl p-5 border border-slate-100">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-xs font-black text-slate-800">Випадкові події</p>
                        <p class="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Увімкнути/Вимкнути систему</p>
                    </div>
                    <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" 
                               [checked]="financeData.userSettings().eventsEnabled" 
                               (change)="toggleEvents()"
                               class="sr-only peer">
                        <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div class="px-8 pb-8">
            <button (click)="gamificationService.toggleInfoModal()"
                    class="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all">
                Зрозуміло
            </button>
        </div>
      </div>
    </div>
    `,
    styles: [`
        .animate-pop-in {
            animation: pop-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
            transform-origin: 50% 0%; /* Origin roughly at the top center near coin counter */
        }

        @keyframes pop-in {
            from {
                opacity: 0;
                transform: scale(0.1) translateY(-100px);
            }
            to {
                opacity: 1;
                transform: scale(1) translateY(0);
            }
        }
    `]
})
export class GamificationModalComponent {
    gamificationService = inject(GamificationService);
    financeData = inject(FinanceDataService);

    toggleEvents() {
        const settings = this.financeData.userSettings();
        this.financeData.saveSettings({
            ...settings,
            eventsEnabled: !settings.eventsEnabled
        });
    }
}

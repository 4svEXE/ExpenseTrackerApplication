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
         class="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[9999] flex items-center justify-center p-2"
         (click)="gamificationService.toggleInfoModal()">
      
      <div class="bg-white rounded-lg w-full h-[98vh] overflow-hidden shadow-2xl animate-expand-coin relative flex flex-col"
           (click)="$event.stopPropagation()">
        
        <!-- Header -->
        <div class="bg-gradient-to-br from-amber-400 to-orange-500 p-8 text-white relative shrink-0">
            <div class="absolute top-4 right-4 cursor-pointer w-10 h-10 flex items-center justify-center rounded-full bg-black/10 hover:bg-black/20 transition-colors" (click)="gamificationService.toggleInfoModal()">
                <i class="fa-solid fa-xmark text-xl"></i>
            </div>
            
            <div class="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4 shadow-xl border border-white/30">
                <i class="fa-solid fa-coins text-3xl"></i>
            </div>
            <h3 class="text-2xl font-black tracking-tight mb-1">Гейміфікація</h3>
            <p class="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Система магічних івентів</p>
        </div>

        <!-- Content -->
        <div class="p-8 overflow-y-auto custom-scrollbar flex-1">
            
            <!-- Timer Section -->
            <div class="mb-8 p-6 bg-slate-900 rounded-2xl text-white text-center shadow-inner">
                <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Наступна пригода через</p>
                <p class="text-4xl font-mono font-black text-amber-400">{{ gamificationService.timeUntilNext }}</p>
            </div>

            <!-- Achievement Section -->
            <div *ngIf="gamificationService.activeAchievement() as achiev" class="mb-8 p-6 bg-indigo-50 rounded-2xl border border-indigo-100">
                <div class="flex items-center gap-3 mb-4">
                    <div class="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-indigo-500 shadow-sm">
                        <i class="fa-solid fa-trophy"></i>
                    </div>
                    <div>
                        <p class="text-[10px] font-black uppercase tracking-widest text-indigo-400">Активний квест</p>
                        <p class="text-sm font-black text-slate-800">{{ achiev.text }}</p>
                    </div>
                </div>
                
                <div class="space-y-2">
                    <div class="flex justify-between text-[10px] font-black uppercase tracking-wider text-slate-500">
                        <span>Прогрес</span>
                        <span>{{ achiev.current }} / {{ achiev.target }}</span>
                    </div>
                    <div class="h-3 bg-white rounded-full p-0.5 shadow-inner">
                        <div class="h-full bg-indigo-500 rounded-full transition-all duration-1000" 
                             [style.width.%]="(achiev.current / achiev.target) * 100"></div>
                    </div>
                    <p class="text-[10px] font-bold text-indigo-600 mt-2">Нагорода: {{ achiev.reward }} <i class="fa-solid fa-coins"></i></p>
                </div>

                <button *ngIf="achiev.completed" 
                        (click)="gamificationService.claimAchievement()"
                        class="w-full mt-4 py-3 bg-amber-400 text-black rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg animate-bounce">
                    Забрати нагороду!
                </button>
            </div>

            <div class="space-y-6 mb-8">
                <div class="flex gap-4">
                    <div class="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0">
                        <i class="fa-solid fa-wand-magic-sparkles"></i>
                    </div>
                    <div>
                        <p class="text-sm font-black text-slate-800 mb-1">Випадкові пригоди</p>
                        <p class="text-xs font-bold text-slate-500 leading-relaxed">Події з'являються циклічно. Кожна має ціну та випадкові наслідки.</p>
                    </div>
                </div>

                <div class="flex gap-4">
                    <div class="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                        <i class="fa-solid fa-shop"></i>
                    </div>
                    <div>
                        <p class="text-sm font-black text-slate-800 mb-1">Навіщо монетки?</p>
                        <p class="text-xs font-bold text-slate-500 leading-relaxed">Використовуйте їх для участі в івентах або скіпайте час очікування (10 монет).</p>
                    </div>
                </div>
            </div>

            <!-- Toggle UI -->
            <div class="bg-slate-50 rounded-2xl p-5 border border-slate-100">
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
        <div class="p-8 pt-0 shrink-0">
            <button (click)="gamificationService.toggleInfoModal()"
                    class="w-full py-4 bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-xl active:scale-95 transition-all">
                Закрити
            </button>
        </div>
      </div>
    </div>
    `,
    styles: [`
        .animate-expand-coin {
            animation: expand-coin 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
            transform-origin: 15% 5%;
        }

        @keyframes expand-coin {
            from {
                opacity: 0;
                transform: scale(0.1) translate(-100px, -100px);
                border-radius: 9999px;
            }
            to {
                opacity: 1;
                transform: scale(1) translate(0, 0);
                border-radius: 0.5rem;
            }
        }

        .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(0,0,0,0.1);
            border-radius: 10px;
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

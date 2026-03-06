import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GamificationService } from '../../../services/gamification.service';
import { FinanceDataService } from '../../../services/finance-data.service';

@Component({
    selector: 'app-gamification-banner',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div *ngIf="financeData.userSettings().eventsEnabled" class="space-y-3">
      
      <!-- Current Event -->
      <div *ngIf="gamificationService.currentEvent() as event" 
           class="relative overflow-hidden bg-white rounded-3xl p-6 shadow-sm border border-slate-100 animate-in slide-in-from-top duration-500">
        <div class="absolute top-0 right-0 p-4 opacity-10">
            <i class="fa-solid fa-dragon text-5xl text-indigo-500"></i>
        </div>
        
        <div class="flex flex-col md:flex-row items-start gap-6">
          <div class="w-16 h-16 rounded-[2rem] bg-indigo-50 text-indigo-500 flex items-center justify-center text-2xl shadow-inner shrink-0 ring-1 ring-indigo-100">
            <i class="fa-solid fa-scroll-old"></i>
          </div>
          
          <div class="flex-1 min-w-0">
            <h4 class="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-2">Фентезі пригода</h4>
            <p class="text-base font-bold text-slate-800 leading-relaxed mb-6">{{ event.text }}</p>
            
            <div class="flex flex-wrap gap-3">
              <button *ngFor="let choice of event.choices; let i = index" 
                      (click)="gamificationService.makeChoice(i)"
                      class="px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg flex items-center gap-2"
                      [ngClass]="choice.cost > 0 ? 'bg-indigo-600 text-white shadow-indigo-200' : 'bg-slate-100 text-slate-600'">
                {{ choice.text }} 
                <span *ngIf="choice.cost > 0" class="flex items-center gap-1 opacity-80">
                  <i class="fa-solid fa-coins"></i> {{ choice.cost }}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Event Result -->
      <div *ngIf="gamificationService.eventResult() as result" 
           class="relative overflow-hidden bg-white rounded-3xl p-6 shadow-xl border-2 animate-in zoom-in duration-300"
           [ngClass]="result.reward > 0 ? 'border-emerald-200' : (result.reward < 0 ? 'border-rose-200' : 'border-slate-100')">
        
        <div class="text-center py-4">
          <div class="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
               [ngClass]="result.reward > 0 ? 'bg-emerald-500 text-white' : (result.reward < 0 ? 'bg-rose-500 text-white' : 'bg-slate-500 text-white')">
            <i class="fa-solid text-2xl" [ngClass]="result.reward > 0 ? 'fa-check' : (result.reward < 0 ? 'fa-skull' : 'fa-info')"></i>
          </div>
          
          <p class="text-lg font-black text-slate-800 mb-2">{{ result.text }}</p>
          <div *ngIf="result.reward !== 0" class="text-2xl font-black mb-6" 
               [ngClass]="result.reward > 0 ? 'text-emerald-500' : 'text-rose-500'">
            {{ result.reward > 0 ? '+' : '' }}{{ result.reward }} <i class="fa-solid fa-coins"></i>
          </div>

          <button (click)="gamificationService.finishEvent()"
                  class="px-10 py-3 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-[10px] active:scale-95 transition-all">
            Продовжити шлях
          </button>
        </div>
      </div>

      <!-- Achievement Section -->
      <div *ngIf="gamificationService.activeAchievement() as achiev" 
           class="bg-indigo-900 rounded-3xl p-4 text-white shadow-xl shadow-indigo-200 relative overflow-hidden group">
        <div class="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
            <i class="fa-solid fa-trophy text-6xl rotate-12"></i>
        </div>
        
        <div class="flex items-center justify-between gap-4 relative z-10">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-amber-300">
                <i class="fa-solid fa-award"></i>
            </div>
            <div>
              <p class="text-[10px] font-black uppercase tracking-widest text-indigo-300">Активна ціль</p>
              <p class="text-sm font-black">{{ achiev.text }}</p>
            </div>
          </div>
          
          <button *ngIf="achiev.completed; else timer"
                  (click)="gamificationService.claimAchievement()"
                  class="px-4 py-2 bg-amber-400 text-black rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-amber-500/20 animate-bounce">
            Отримати {{ achiev.reward }} <i class="fa-solid fa-coins"></i>
          </button>
          
          <ng-template #timer>
            <div class="text-right">
              <p class="text-[9px] font-black uppercase text-indigo-300">Нова подія через</p>
              <p class="text-xs font-mono font-black">{{ gamificationService.timeUntilNext }}</p>
              <button (click)="gamificationService.skipTime()" 
                      class="text-[8px] font-black uppercase text-indigo-400 hover:text-white transition-colors cursor-pointer">
                Скіпнути (10 монеток)
              </button>
            </div>
          </ng-template>
        </div>
      </div>

    </div>
  `,
    styles: [`
    :host { display: block; }
  `]
})
export class GamificationBannerComponent {
    gamificationService = inject(GamificationService);
    financeData = inject(FinanceDataService);
}

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GamificationService } from '../../../services/gamification.service';
import { FinanceDataService } from '../../../services/finance-data.service';

@Component({
  selector: 'app-gamification-banner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="financeData.userSettings().eventsEnabled" class="space-y-2">
      
      <!-- Current Event (Compact Mode) -->
      <div *ngIf="gamificationService.currentEvent() as event" 
           class="relative overflow-hidden bg-white rounded-2xl p-4 shadow-sm border border-slate-100 animate-in slide-in-from-top duration-300">
        <div class="absolute top-0 right-0 p-3 opacity-5">
            <i class="fa-solid fa-dragon text-3xl text-indigo-500"></i>
        </div>
        
        <div class="flex items-start gap-4">
          <div class="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-500 overflow-hidden shadow-inner shrink-0 ring-1 ring-indigo-50 flex items-center justify-center">
            <img *ngIf="event.iconUrl" [src]="event.iconUrl" class="w-full h-full object-cover" alt="Character">
            <i *ngIf="!event.iconUrl" class="fa-solid fa-scroll-old text-xl"></i>
          </div>
          
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between mb-1">
                <h4 class="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-400">Фентезі пригода</h4>
            </div>
            <p class="text-sm font-bold text-slate-800 leading-tight mb-3 pr-4">{{ event.text }}</p>
            
            <div class="flex flex-wrap gap-2">
              <button *ngFor="let choice of event.choices; let i = index" 
                      (click)="gamificationService.makeChoice(i)"
                      [disabled]="(financeData.userSettings().coins || 0) < choice.cost"
                      class="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:grayscale"
                      [ngClass]="choice.cost > 0 ? 'bg-indigo-600 text-white shadow-indigo-100' : 'bg-slate-100 text-slate-500'">
                {{ choice.text }} 
                <span *ngIf="choice.cost > 0" class="flex items-center gap-1 opacity-80">
                  <i class="fa-solid fa-coins"></i> {{ choice.cost }}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Event Result (Compact) -->
      <div *ngIf="gamificationService.eventResult() as result" 
           class="relative overflow-hidden bg-white rounded-2xl p-4 shadow-lg border-2 animate-in zoom-in duration-300"
           [ngClass]="result.reward > 0 ? 'border-emerald-100' : (result.reward < 0 ? 'border-rose-100' : 'border-slate-100')">
        
        <div class="flex items-center gap-4">
          <div class="w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm"
               [ngClass]="result.reward > 0 ? 'bg-emerald-500 text-white' : (result.reward < 0 ? 'bg-rose-500 text-white' : 'bg-slate-500 text-white')">
            <i class="fa-solid text-base" [ngClass]="result.reward > 0 ? 'fa-check' : (result.reward < 0 ? 'fa-skull' : 'fa-info')"></i>
          </div>
          
          <div class="flex-1">
            <p class="text-sm font-black text-slate-800 leading-tight">{{ result.text }}</p>
            <div *ngIf="result.reward !== 0" class="text-base font-black" 
                 [ngClass]="result.reward > 0 ? 'text-emerald-500' : 'text-rose-500'">
              {{ result.reward > 0 ? '+' : '' }}{{ result.reward }} <i class="fa-solid fa-coins"></i>
            </div>
          </div>

          <button (click)="gamificationService.finishEvent()"
                  class="px-6 py-2 bg-black text-white rounded-xl font-black uppercase tracking-widest text-[9px]">
            ОК
          </button>
        </div>
      </div>

      <!-- Achievement Section (With Hide Option) -->
      <div *ngIf="gamificationService.activeAchievement() as achiev" 
           class="relative bg-slate-900 rounded-2xl p-3 text-white shadow-md relative overflow-hidden active-goal"
           [class.hidden-goal]="isGoalHidden">
        
        <div class="flex items-center justify-between gap-4 text-content">
          <div class="flex items-center gap-3">
            <div class="goal-icon w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-amber-300 shrink-0">
                <i class="fa-solid fa-award text-xs"></i>
            </div>
            <div *ngIf="!isGoalHidden">
              <p class="text-[8px] font-black uppercase tracking-widest text-slate-400">
                Активна ціль <span *ngIf="achiev.target > 1">• {{ achiev.current }} / {{ achiev.target }}</span>
              </p>
              <p class="text-xs font-black">{{ achiev.text }}</p>
            </div>
          </div>
          
          <div class="flex items-center gap-2">
              <button *ngIf="!isGoalHidden && achiev.completed"
                      (click)="gamificationService.claimAchievement()"
                      class="px-3 py-1.5 bg-amber-400 text-black rounded-lg text-[9px] font-black uppercase tracking-widest non-animated-btn">
                {{ achiev.reward }} <i class="fa-solid fa-coins"></i>
              </button>

              <button (click)="isGoalHidden = !isGoalHidden" 
                      class="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-slate-400">
                <i class="fa-solid" [ngClass]="isGoalHidden ? 'fa-chevron-down' : 'fa-chevron-up'"></i>
              </button>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    :host { display: block; }
    .hidden-goal {
        background: transparent !important;
        border: 1px dashed rgba(0,0,0,0.1);
        color: #64748b !important;
        box-shadow: none !important;
        .goal-icon { background: #f1f5f9; color: #94a3b8; }
    }
  `]
})
export class GamificationBannerComponent {
  gamificationService = inject(GamificationService);
  financeData = inject(FinanceDataService);
  isGoalHidden = false;
}

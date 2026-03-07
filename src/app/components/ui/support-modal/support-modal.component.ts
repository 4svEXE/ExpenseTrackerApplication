import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupportService } from '../../../services/support.service';

@Component({
  selector: 'app-support-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="supportService.config().isOpen" class="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
      <div class="bg-white rounded-[2.5rem] w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in duration-300 border border-white/20 relative">
        
        <!-- Close Button -->
        <button 
          (click)="supportService.close()"
          class="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all active:scale-90 z-10"
        >
          <i class="fa-solid fa-xmark text-lg"></i>
        </button>

        <!-- Donation Request -->
        <div *ngIf="supportService.config().type === 'donation_request'" class="p-8 text-center">
          <div class="w-20 h-20 bg-amber-50 text-amber-500 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner ring-1 ring-amber-100">
            <i class="fa-solid fa-heart text-3xl animate-pulse"></i>
          </div>
          <h3 class="text-2xl font-black text-slate-900 mb-3 tracking-tight">Підтримайте проект</h3>
          <p class="text-slate-500 font-bold leading-relaxed mb-8">
            Навіть 10 грн допоможуть нам ставати кращими та додавати нові фішки! 🚀
            (в налатуваннях можна відключити це зубожіле прохання автора)
          </p>
          
          <div class="space-y-3">
            <a 
              href="https://send.monobank.ua/jar/7iYKvKtNXp" 
              target="_blank"
              (click)="supportService.close()"
              class="block w-full py-4 bg-amber-500 text-white rounded-2xl font-black shadow-lg shadow-amber-200 hover:bg-amber-600 transition-all active:scale-95 text-sm uppercase tracking-widest"
            >
              Поділитись копійчиною 💰
            </a>
            <button 
              (click)="supportService.close()" 
              class="w-full py-4 font-black text-slate-400 hover:text-slate-600 transition-colors text-xs uppercase tracking-widest"
            >
              Сорі, наступного разу 😢
            </button>
          </div>
        </div>

        <!-- Feedback Loop -->
        <div *ngIf="supportService.config().type === 'feedback_loop'" class="p-8 text-center">
          <div class="w-20 h-20 bg-indigo-50 text-indigo-500 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner ring-1 ring-indigo-100">
            <i class="fa-solid fa-face-smile text-3xl"></i>
          </div>
          <h3 class="text-2xl font-black text-slate-900 mb-3 tracking-tight">Вам подобається додаток?</h3>
          <p class="text-slate-500 font-bold leading-relaxed mb-8">
            Нам важливо знати вашу думку!
          </p>
          
          <div class="grid grid-cols-2 gap-4">
            <button 
              (click)="supportService.handleNo()"
              class="py-4 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition-all active:scale-95 text-xs uppercase tracking-widest"
            >
              Ні 😢
            </button>
            <button 
              (click)="supportService.handleYes()"
              class="py-4 bg-black text-white rounded-2xl font-black shadow-lg hover:bg-neutral-800 transition-all active:scale-95 text-xs uppercase tracking-widest"
            >
              Так! ✨
            </button>
          </div>
          <p *ngIf="supportService.config().upsetCount > 0" class="mt-4 text-[10px] text-rose-500 font-black uppercase tracking-tighter animate-bounce">
            Ой! З балансу знято 5 монеток... ({{ supportService.config().upsetCount }}/5)
          </p>
          <div class="mt-4 text-center">
            <button 
              (click)="supportService.close()" 
              class="w-full py-4 font-black text-slate-400 hover:text-slate-600 transition-colors text-[10px] uppercase tracking-widest"
            >
              Закрити
            </button>
          </div>
        </div>

        <!-- Gratitude (Links) -->
        <div *ngIf="supportService.config().type === 'gratitude'" class="p-8 text-center">
          <div class="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner ring-1 ring-emerald-100">
            <i class="fa-solid fa-stars text-3xl"></i>
          </div>
          <h3 class="text-2xl font-black text-slate-900 mb-3 tracking-tight">Дякуємо! ❤️</h3>
          <p class="text-slate-500 font-bold leading-relaxed mb-8">
            Ви можете долучитись до нашої спільноти та підтримати нас:
          </p>
          
          <div class="space-y-3">
            <a 
              href="https://t.me/+pLDBzgIEVZc0MTQy" 
              target="_blank"
              class="flex items-center justify-center gap-3 w-full py-4 bg-[#229ED9] text-white rounded-2xl font-black shadow-lg hover:brightness-110 transition-all active:scale-95 text-xs uppercase tracking-widest"
            >
              <i class="fa-brands fa-telegram text-lg"></i> Telegram
            </a>
            <a 
              href="https://send.monobank.ua/jar/7iYKvKtNXp" 
              target="_blank"
              class="flex items-center justify-center gap-3 w-full py-4 bg-amber-500 text-white rounded-2xl font-black shadow-lg hover:bg-amber-600 transition-all active:scale-95 text-xs uppercase tracking-widest"
            >
              <i class="fa-solid fa-heart"></i> Задонатити
            </a>
            <a 
              href="https://www.instagram.com/sv.png/" 
              target="_blank"
              class="flex items-center justify-center gap-3 w-full py-4 bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white rounded-2xl font-black shadow-lg hover:brightness-110 transition-all active:scale-95 text-xs uppercase tracking-widest"
            >
              <i class="fa-brands fa-instagram text-lg"></i> Автор
            </a>
            <button 
              (click)="supportService.close()" 
              class="w-full py-4 font-black text-slate-400 hover:text-slate-600 transition-colors text-[10px] uppercase tracking-widest"
            >
              Закрити
            </button>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    @keyframes zoom-in {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
    .animate-in {
      animation: zoom-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
  `]
})
export class SupportModalComponent {
  supportService = inject(SupportService);
}

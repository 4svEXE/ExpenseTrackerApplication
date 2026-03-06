import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmService } from '../../../services/confirm.service';

@Component({
    selector: 'app-confirm-dialog',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div *ngIf="confirmService.isOpen()" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in duration-200">
        <div class="p-8 text-center">
          <div class="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-100 shadow-sm">
            <i class="fa-solid fa-trash-can text-2xl"></i>
          </div>
          <h3 class="text-xl font-bold text-slate-900 mb-2">Підтвердження</h3>
          <p class="text-slate-500 font-medium break-words leading-relaxed text-sm">
            {{ confirmService.message() }}
          </p>
        </div>
        
        <div class="flex border-t border-slate-100">
          <button 
            (click)="confirmService.handleAction(false)" 
            class="flex-1 py-4 font-bold text-slate-500 hover:bg-slate-50 transition-colors uppercase tracking-wider text-[10px]"
          >
            Скасувати
          </button>
          <div class="w-px bg-slate-100"></div>
          <button 
            (click)="confirmService.handleAction(true)" 
            class="flex-1 py-4 font-bold text-rose-600 hover:bg-rose-50 transition-colors uppercase tracking-wider text-[10px]"
          >
            Видалити
          </button>
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
      animation: zoom-in 0.2s ease-out;
    }
  `]
})
export class ConfirmDialogComponent {
    confirmService = inject(ConfirmService);
}

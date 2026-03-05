import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed top-5 right-5 z-[99999] space-y-3 pointer-events-none">
      <div *ngFor="let toast of toastService.toasts()"
        class="pointer-events-auto min-w-[300px] flex items-center gap-3 bg-white/90 backdrop-blur-xl border border-slate-200 p-4 rounded-2xl shadow-2xl animate-toast-in overflow-hidden relative">
        <div class="absolute left-0 top-0 bottom-0 w-1.5" 
             [ngClass]="toast.type === 'success' ? 'bg-emerald-500' : (toast.type === 'error' ? 'bg-rose-500' : 'bg-blue-500')"></div>
        
        <div class="w-10 h-10 rounded-xl flex items-center justify-center"
             [ngClass]="toast.type === 'success' ? 'bg-emerald-50' : (toast.type === 'error' ? 'bg-rose-50' : 'bg-blue-50')">
          <i class="fa-solid" [ngClass]="toast.type === 'success' ? 'fa-circle-check text-emerald-600' : (toast.type === 'error' ? 'fa-circle-xmark text-rose-600' : 'fa-circle-info text-blue-600')"></i>
        </div>
        
        <div class="flex-1">
          <p class="text-xs font-extrabold text-slate-900 leading-tight">{{ toast.message }}</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes toast-in {
      from { transform: translateX(100%) scale(0.9); opacity: 0; }
      to { transform: translateX(0) scale(1); opacity: 1; }
    }
    .animate-toast-in {
      animation: toast-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
    }
  `]
})
export class ToastComponent {
  toastService = inject(ToastService);
}

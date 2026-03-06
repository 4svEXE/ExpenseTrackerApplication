import { Component, inject, HostListener } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { HeaderComponent } from './components/layout/header/header.component';
import { NavComponent } from './components/layout/nav/nav.component';
import { ToastComponent } from './components/ui/toast/toast.component';
import { SpendingPlanPopupComponent } from './components/layout/spending-plan-popup/spending-plan-popup.component';
import { ConfirmDialogComponent } from './components/ui/confirm-dialog/confirm-dialog.component';
import { SupportModalComponent } from './components/ui/support-modal/support-modal.component';
import { GamificationModalComponent } from './components/ui/gamification-modal/gamification-modal.component';
import { FinanceDataService } from './services/finance-data.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    HeaderComponent,
    NavComponent,
    ToastComponent,
    SpendingPlanPopupComponent,
    ConfirmDialogComponent,
    SupportModalComponent,
    GamificationModalComponent,
    CommonModule,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  private router = inject(Router);
  financeData = inject(FinanceDataService);

  @HostListener('window:popstate')
  onPopState() {
    // If not on dashboard, redirect back to it
    if (this.router.url !== '/dashboard' && this.router.url !== '/') {
      this.router.navigate(['/dashboard'], { replaceUrl: true });
    }
  }
}

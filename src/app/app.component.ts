import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/layout/header/header.component';
import { NavComponent } from './components/layout/nav/nav.component';
import { ToastComponent } from './components/ui/toast/toast.component';
import { SpendingPlanPopupComponent } from './components/layout/spending-plan-popup/spending-plan-popup.component';
import { FinanceDataService } from './services/finance-data.service';
import { inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { NotificationService } from './services/notification.service';

const components = [
  HeaderComponent,
  NavComponent,
  ToastComponent,
  SpendingPlanPopupComponent
]

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, components],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  financeData = inject(FinanceDataService);
  notificationService = inject(NotificationService);
  title = 'ExpenseTrackerApplication';
}

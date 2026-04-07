import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

// Import all subcomponents
import { FinancialAssistantComponent } from '../../components/dashboard/financial-assistant/financial-assistant.component';
import { IncomeVisualizerComponent } from '../../components/dashboard/income-visualizer/income-visualizer.component';
import { GrowthChartComponent } from '../../components/dashboard/growth-chart/growth-chart.component';
import { TransactionsTableComponent } from '../../components/dashboard/transactions-table/transactions-table.component';
import { MonthPlanComponent } from '../../components/dashboard/month-plan/month-plan.component';
import { MonthAnalyticsComponent } from '../../components/dashboard/month-analytics/month-analytics.component';
import { AccountsListComponent } from '../../components/dashboard/accounts-list/accounts-list.component';
import { SubscriptionsListComponent } from '../../components/dashboard/subscriptions-list/subscriptions-list.component';
import { GamificationBannerComponent } from '../../components/dashboard/gamification-banner/gamification-banner.component';

import { ExpectedCalendarComponent } from '../../components/dashboard/expected-calendar/expected-calendar.component';
import { FinanceDataService, Subscription, SubscriptionPeriod } from '../../services/finance-data.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    FinancialAssistantComponent,
    IncomeVisualizerComponent,
    GrowthChartComponent,
    TransactionsTableComponent,
    MonthPlanComponent,
    MonthAnalyticsComponent,
    SubscriptionsListComponent,
    GamificationBannerComponent
  ],
  template: `
    <div class="dashboard-wrapper min-h-screen bg-slate-50/50 p-2 md:p-8 pt-[52px] md:pt-[72px] font-sans">
      <div class="max-w-[1600px] mx-auto space-y-4 md:space-y-8">
        
        <!-- Header / Main Dashboard Section (A) -->
        <section class="space-y-4 md:space-y-6">
          <!-- Gamification Events & Achievements -->
          <app-gamification-banner></app-gamification-banner>

          <!-- Top Row: Assistant + Growth Chart -->
          <div class="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6 relative z-10">
            <div class="xl:col-span-2">
              <app-financial-assistant class="block h-full"></app-financial-assistant>
            </div>
            <div class="xl:col-span-1">
              <app-growth-chart class="block h-full"></app-growth-chart>
            </div>
          </div>

          <!-- Middle Row: Income Visualizer + Transactions Context -->
          <div class="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6">
            <div class="xl:col-span-1">
              <app-income-visualizer></app-income-visualizer>
            </div>
            <div class="xl:col-span-2">
              <app-transactions-table class="block h-full"></app-transactions-table>
            </div>
          </div>

          <!-- Subscriptions List -->
          <div class="pt-4 md:pt-8">
            <app-subscriptions-list
              (subscriptionClicked)="openSubDetail($event)"
              (addSubscriptionClicked)="openAddSubRoute()">
            </app-subscriptions-list>
          </div>
        </section>

        <!-- Planning & Analytics Section (B) -->
        <section class="space-y-4 md:space-y-6 pb-20 p-4 md:p-8 bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/60 mt-4 md:mt-8">
          <div class="flex items-center gap-3 mb-4 md:mb-6">
            <h2 class="text-xl md:text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 shadow-sm border border-indigo-100">
                <i class="fa-solid fa-chart-pie"></i>
              </div>
              Планування та Аналітика
            </h2>
            <div class="h-px bg-slate-100 flex-1"></div>
          </div>
          
          <div class="pb-4">
            <app-month-analytics></app-month-analytics>
          </div>
          <div class="mt-4 md:mt-6">
            <app-month-plan></app-month-plan>
          </div>
        </section>



      </div>
    </div>

    <!-- Subscription Detail / Edit Popup -->
    @if (selectedSub()) {
    <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
         (click)="closeSubDetail()">
      <div class="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl" (click)="$event.stopPropagation()">
        <!-- Header -->
        <div class="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 class="text-xl font-bold text-slate-900 flex items-center gap-2">
            <div class="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 text-lg font-black">
              {{ selectedSub()!.name.charAt(0) }}
            </div>
            {{ selectedSub()!.name }}
          </h3>
          <button (click)="closeSubDetail()" class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 transition-colors">
            <i class="fa-solid fa-times"></i>
          </button>
        </div>

        <!-- Details / Edit Form -->
        <div class="p-6 space-y-4">
          @if (!isEditingSub()) {
            <div class="grid grid-cols-2 gap-4">
              <div class="bg-slate-50 rounded-2xl p-4">
                <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Ціна</div>
                <div class="text-xl font-black text-slate-900">{{ selectedSub()!.price | currency:selectedSub()!.currency:'symbol-narrow':'1.0-2' }}</div>
                @if (selectedSub()!.currency !== userCurrency) {
                  <div class="text-xs text-slate-400 mt-0.5">≈ {{ getPriceInUserCurrency(selectedSub()!) | currency:userCurrency:'symbol-narrow':'1.0-2' }}</div>
                }
              </div>
              <div class="bg-slate-50 rounded-2xl p-4">
                <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Наступна оплата</div>
                <div class="text-base font-bold text-slate-800">{{ selectedSub()!.nextPaymentDate | date:'d MMMM':'':'uk-UA' }}</div>
                <div class="text-xs mt-0.5" [ngClass]="getDaysLeft(selectedSub()!.nextPaymentDate) <= 3 ? 'text-rose-500 font-bold' : 'text-slate-400'">
                  через {{ getDaysLeft(selectedSub()!.nextPaymentDate) }} дн.
                </div>
              </div>
              <div class="bg-slate-50 rounded-2xl p-4">
                <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Період</div>
                <div class="text-base font-bold text-slate-800">{{ getPeriodLabel(selectedSub()!.period) }}</div>
              </div>
              <div class="bg-purple-50 rounded-2xl p-4">
                <div class="text-[10px] font-bold text-purple-400 uppercase tracking-wider mb-1">Витрачено всього</div>
                <div class="text-base font-bold text-purple-700">{{ getTotalSpentInUserCurrency(selectedSub()!) | currency:userCurrency:'symbol-narrow':'1.0-0' }}</div>
              </div>
            </div>
          } @else {
            <div class="space-y-4">
              <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Назва сервісу</label>
                <input [ngModel]="editSubName()" (ngModelChange)="editSubName.set($event)" type="text"
                  class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold outline-none focus:border-purple-500 text-black">
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Ціна</label>
                  <input [ngModel]="editSubPrice()" (ngModelChange)="editSubPrice.set($event)" type="number"
                    class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold outline-none focus:border-purple-500 text-black">
                </div>
                <div>
                  <label class="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Валюта</label>
                  <select [ngModel]="editSubCurrency()" (ngModelChange)="editSubCurrency.set($event)"
                    class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold outline-none focus:border-purple-500 text-black">
                    <option value="UAH">UAH</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="CZK">CZK</option>
                  </select>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Період</label>
                  <select [ngModel]="editSubPeriod()" (ngModelChange)="editSubPeriod.set($event)"
                    class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold outline-none focus:border-purple-500 text-black">
                    <option value="monthly">Місяць</option>
                    <option value="3months">3 місяці</option>
                    <option value="yearly">Рік</option>
                  </select>
                </div>
                <div>
                  <label class="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Наступна дата</label>
                  <input [ngModel]="editSubNextDate()" (ngModelChange)="editSubNextDate.set($event)" type="date"
                    class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold outline-none focus:border-purple-500 text-black">
                </div>
              </div>
            </div>
          }
        </div>

        <!-- Actions -->
        <div class="p-6 bg-slate-50 flex gap-3">
          @if (!isEditingSub()) {
            <button (click)="closeSubDetail()" class="flex-1 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-all">
              Закрити
            </button>
            <button (click)="toggleEditingSub()"
              class="flex-1 py-3 rounded-xl font-bold bg-black text-white text-center hover:bg-neutral-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
              <i class="fa-solid fa-pen text-xs"></i> Редагувати
            </button>
          } @else {
            <button (click)="toggleEditingSub()" class="flex-1 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-all">
              Скасувати
            </button>
            <button (click)="saveEditSub()"
              class="flex-1 py-3 rounded-xl font-bold bg-purple-600 text-white text-center hover:bg-purple-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
              <i class="fa-solid fa-save text-xs"></i> Зберегти
            </button>
          }
        </div>
      </div>
    </div>
    }
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class DashboardComponent {
  financeData = inject(FinanceDataService);
  router = inject(Router);
  selectedSub = signal<Subscription | null>(null);
  
  // Edit Sub State
  isEditingSub = signal(false);
  editSubName = signal('');
  editSubPrice = signal(0);
  editSubCurrency = signal('');
  editSubNextDate = signal('');
  editSubPeriod = signal<SubscriptionPeriod>('monthly');

  get userCurrency() {
    return this.financeData.userSettings().currency;
  }

  openSubDetail(sub: Subscription) {
    this.selectedSub.set(sub);
    this.isEditingSub.set(false);
    // Sync edit fields
    this.editSubName.set(sub.name);
    this.editSubPrice.set(sub.price);
    this.editSubCurrency.set(sub.currency);
    this.editSubNextDate.set(new Date(sub.nextPaymentDate).toISOString().split('T')[0]);
    this.editSubPeriod.set(sub.period);
  }

  closeSubDetail() {
    this.selectedSub.set(null);
    this.isEditingSub.set(false);
  }

  toggleEditingSub() {
    this.isEditingSub.set(!this.isEditingSub());
  }

  saveEditSub() {
    const sub = this.selectedSub();
    if (!sub) return;

    const price = this.editSubPrice();
    const currency = this.editSubCurrency();
    const priceUah = price * this.financeData.getExchangeRate(currency, 'UAH');

    const updatedSub: Subscription = {
      ...sub,
      name: this.editSubName(),
      price: price,
      currency: currency,
      priceUah: priceUah,
      priceEur: priceUah * this.financeData.getExchangeRate('UAH', 'EUR'),
      nextPaymentDate: new Date(this.editSubNextDate()),
      period: this.editSubPeriod()
    };

    const subs = [...this.financeData.subscriptions()];
    const idx = subs.findIndex(s => s.id === sub.id);
    if (idx !== -1) {
      subs[idx] = updatedSub;
      this.financeData.saveSubscriptions(subs);
      this.selectedSub.set(updatedSub);
      this.isEditingSub.set(false);
      this.financeData.toasts.show('Підписку оновлено!', 'success');
    }
  }

  openAddSubRoute() {
    this.router.navigate(['/wallets']);
  }

  getPriceInUserCurrency(s: Subscription): number {
    return s.priceUah * this.financeData.getExchangeRate('UAH', this.userCurrency);
  }

  getTotalSpentInUserCurrency(s: Subscription): number {
    return s.totalSpent * this.financeData.getExchangeRate(s.currency, this.userCurrency);
  }

  getDaysLeft(date: Date): number {
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  }

  getPeriodLabel(period: string): string {
    const labels: Record<string, string> = {
      'monthly': 'Раз в місяць',
      '3months': 'Раз в 3 місяці',
      'yearly': 'Раз в рік',
      'custom': 'Кастомно'
    };
    return labels[period] || period;
  }
}

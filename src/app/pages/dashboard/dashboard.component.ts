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
import { SubscriptionsListComponent } from '../../components/dashboard/subscriptions-list/subscriptions-list.component';
import { GamificationBannerComponent } from '../../components/dashboard/gamification-banner/gamification-banner.component';
import { ExpectedCalendarComponent } from '../../components/dashboard/expected-calendar/expected-calendar.component';
import { BudgetStatsComponent } from '../../components/dashboard/budget-stats/budget-stats.component';
import { AiChatComponent } from '../../components/ui/ai-chat/ai-chat.component';
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
    SubscriptionsListComponent,
    GamificationBannerComponent,
    ExpectedCalendarComponent,
    BudgetStatsComponent,
    AiChatComponent,
    MonthAnalyticsComponent
  ],
  template: `
    <div class="dashboard-wrapper min-h-screen bg-slate-50/50 p-2 md:p-8 pt-[52px] md:pt-[72px] font-sans relative">
      <div class="max-w-[1600px] mx-auto space-y-4 md:space-y-12 pb-24">
        
        <!-- Hero Row: Assistant + Growth Chart (Non-collapsible) -->
        <section class="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6 relative z-10 transition-all">
          <div class="xl:col-span-2">
            <app-financial-assistant class="block h-full"></app-financial-assistant>
          </div>
          <div class="xl:col-span-1">
            <app-growth-chart class="block h-full"></app-growth-chart>
          </div>
        </section>

        <!-- Income Visualizer + Transactions Context -->
        <section class="space-y-4">
          <div class="flex items-center justify-between px-2">
            <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
               <i class="fa-solid fa-chart-line"></i> Динаміка капіталу
            </h4>
            <button (click)="toggleSection('income')" class="text-slate-400 hover:text-slate-800 transition-colors w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100/50">
               <i class="fa-solid" [ngClass]="isSectionCollapsed('income') ? 'fa-chevron-down' : 'fa-chevron-up'"></i>
            </button>
          </div>
          
          <div [hidden]="isSectionCollapsed('income')" class="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6 animate-in slide-in-from-top-4 duration-300">
            <div class="xl:col-span-1">
              <app-income-visualizer></app-income-visualizer>
            </div>
            <div class="xl:col-span-2">
              <app-transactions-table class="block h-full"></app-transactions-table>
            </div>
          </div>
        </section>

        <!-- Category Budget Visualization -->
        <section class="space-y-4">
          <div class="flex items-center justify-between px-2">
            <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
               <i class="fa-solid fa-chart-pie"></i> Розподіл витрат
            </h4>
            <button (click)="toggleSection('budget')" class="text-slate-400 hover:text-slate-800 transition-colors w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100/50">
               <i class="fa-solid" [ngClass]="isSectionCollapsed('budget') ? 'fa-chevron-down' : 'fa-chevron-up'"></i>
            </button>
          </div>
          
          <div [hidden]="isSectionCollapsed('budget')" class="animate-in slide-in-from-top-4 duration-300">
             <app-budget-stats></app-budget-stats>
          </div>
        </section>

        <!-- Expected Calendar (Standalone) -->
        <section class="space-y-4">
          <div class="flex items-center justify-between px-2">
            <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
               <i class="fa-solid fa-calendar-day"></i> Календар планування
            </h4>
            <button (click)="toggleSection('calendar')" class="text-slate-400 hover:text-slate-800 transition-colors w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100/50">
               <i class="fa-solid" [ngClass]="isSectionCollapsed('calendar') ? 'fa-chevron-down' : 'fa-chevron-up'"></i>
            </button>
          </div>
          
          <div [hidden]="isSectionCollapsed('calendar')" class="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 animate-in slide-in-from-top-4 duration-300">
             <app-expected-calendar></app-expected-calendar>
          </div>
        </section>

        <!-- Gamification Banner (Events) -->
        <section class="animate-in fade-in duration-500">
           <app-gamification-banner></app-gamification-banner>
        </section>

        <!-- Subscriptions List -->
        <section class="space-y-4">
          <div class="flex items-center justify-between px-2">
            <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
               <i class="fa-solid fa-retweet"></i> Рекурсивні платежі
            </h4>
            <button (click)="toggleSection('subscriptions')" class="text-slate-400 hover:text-slate-800 transition-colors w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100/50">
               <i class="fa-solid" [ngClass]="isSectionCollapsed('subscriptions') ? 'fa-chevron-down' : 'fa-chevron-up'"></i>
            </button>
          </div>
          
          <div [hidden]="isSectionCollapsed('subscriptions')" class="animate-in slide-in-from-top-4 duration-300">
            <app-subscriptions-list
              (subscriptionClicked)="openSubDetail($event)"
              (addSubscriptionClicked)="openAddSubRoute()">
            </app-subscriptions-list>
          </div>
        </section>

        <!-- Planning & Analytics Section -->
        <section class="space-y-4 md:space-y-6 pb-12 p-4 md:p-8 bg-white/40 backdrop-blur-sm rounded-[2.5rem] border border-white/60 shadow-sm">
          <div class="flex items-center justify-between mb-4 md:mb-6">
            <h2 class="text-xl md:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-4">
              <div class="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-100">
                <i class="fa-solid fa-chart-simple"></i>
              </div>
              Баланс та Планування
            </h2>
            <button (click)="toggleSection('planning')" class="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-800 transition-all">
                <i class="fa-solid" [ngClass]="isSectionCollapsed('planning') ? 'fa-chevron-down' : 'fa-chevron-up'"></i>
            </button>
          </div>
          
          <div [hidden]="isSectionCollapsed('planning')" class="space-y-8 animate-in slide-in-from-top-4 duration-300">
            <app-month-analytics></app-month-analytics>
            <div class="h-px bg-slate-100/80"></div>
            <app-month-plan></app-month-plan>
          </div>
        </section>

      </div>
    </div>

    <!-- AI Chat Floating Button -->
    <div *ngIf="financeData.userSettings().showAiChat && financeData.userSettings().geminiApiKey" class="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-[150] group">
       <button (click)="openAiChat()" 
               class="w-14 h-14 md:w-16 md:h-16 rounded-[2rem] bg-indigo-600 text-white shadow-2xl shadow-indigo-200 flex items-center justify-center hover:bg-slate-900 hover:scale-110 active:scale-90 transition-all">
          <i class="fa-solid fa-robot text-xl md:text-2xl"></i>
       </button>
    </div>

    <!-- AI Chat Full Screen Modal -->
    <app-ai-chat *ngIf="isAiChatOpen()" (close)="closeAiChat()"></app-ai-chat>

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
    :host { display: block; }
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

  isAiChatOpen = signal(false);
  collapsedSections = signal<Record<string, boolean>>({});

  toggleSection(section: string) {
    const current = { ...this.collapsedSections() };
    current[section] = !current[section];
    this.collapsedSections.set(current);
  }

  isSectionCollapsed(section: string): boolean {
    return !!this.collapsedSections()[section];
  }

  openAiChat() {
    this.isAiChatOpen.set(true);
    document.body.style.overflow = 'hidden';
  }

  closeAiChat() {
    this.isAiChatOpen.set(false);
    document.body.style.overflow = '';
  }

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

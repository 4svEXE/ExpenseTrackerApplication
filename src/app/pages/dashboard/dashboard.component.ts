import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

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

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FinancialAssistantComponent,
    IncomeVisualizerComponent,
    GrowthChartComponent,
    TransactionsTableComponent,
    MonthPlanComponent,
    MonthAnalyticsComponent,
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
          <app-month-plan></app-month-plan>
        </section>

      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class DashboardComponent {
}

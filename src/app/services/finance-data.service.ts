import { Injectable, signal, inject, computed } from '@angular/core';
import { TransactionService } from './transaction.service';
import { AudioService } from './audio.service';
import { ToastService } from './toast.service';
import { SettingsService, UserSettings } from './settings.service';

export type { UserSettings };

export interface Transaction {
  id: string;
  title: string;
  tags: string[];
  paymentType: string;
  date: Date;
  amountUah: number;
  amountEur: number;
  account: string;
  client: string;
  type: 'income' | 'expense';
  category: string;
  expenseColor?: string;
}

export interface IncomePlan {
  id: string;
  category: string;
  planAmount: number;
  factAmount: number;
}

export interface ExpensePlan {
  id: string;
  category: string;
  type: 'mandatory' | 'savings' | 'unexpected';
  amount: number;
}

export interface AccountBalance {
  id: string;
  name: string;
  balance: number;
  currency: string;
  tags: string[];
  color?: string;
}

export interface Subscription {
  id: string;
  name: string;
  priceUah: number;
  priceEur?: number;
  nextPaymentDate: Date;
  totalSpent: number;
}

@Injectable({
  providedIn: 'root'
})
export class FinanceDataService {
  private readonly INCOME_PLANS_KEY = 'incomePlans';
  private readonly EXPENSE_PLANS_KEY = 'expensePlans';
  private readonly ACCOUNTS_KEY = 'accounts';
  private readonly SUBSCRIPTIONS_KEY = 'subscriptions';

  private settingsService = inject(SettingsService);
  private ts = inject(TransactionService);
  private audio = inject(AudioService);
  private toasts = inject(ToastService);

  userSettings = this.settingsService.userSettings;

  // Data Signals
  transactions = signal<Transaction[]>([]);
  incomePlans = signal<IncomePlan[]>([]);
  expensePlans = signal<ExpensePlan[]>([]);
  accounts = signal<AccountBalance[]>([]);
  subscriptions = signal<Subscription[]>([]);

  totalBalance = computed(() => {
    const mainCurrency = this.userSettings().currency;
    return this.accounts().reduce((sum, acc) => {
      let balance = acc.balance;
      if (acc.currency !== mainCurrency) {
        balance = balance * this.getExchangeRate(acc.currency, mainCurrency);
      }
      return sum + balance;
    }, 0);
  });

  private notifiedGoals = new Set<string>();

  constructor() {
    this.loadData();

    // Subscribe to all transactions from the central service
    this.ts.allTransactions$.subscribe((txs: any[]) => {
      const parsed = txs.map((t: any, index) => {
        let accountName = t.account || 'Картка/Готівка';
        if (t.accountId) {
          const matchingAccount = this.accounts().find(a => a.id === t.accountId);
          if (matchingAccount) accountName = matchingAccount.name;
        }

        let transactionDate: Date;
        if (typeof t.date === 'string' && t.date.includes('-') && !t.date.includes('T')) {
          const [y, m, d] = t.date.split('-').map(Number);
          transactionDate = new Date(y, m - 1, d);
        } else {
          transactionDate = new Date(t.date);
        }

        return {
          ...t,
          id: t.id || index.toString(),
          date: transactionDate,
          amountUah: t.amount !== undefined ? t.amount : (t.amountUah || 0),
          amountEur: t.amountEur || 0,
          type: (t.transactionType === 'income' || t.type === 'income') ? 'income' : 'expense',
          title: t.description || t.title || t.category || 'Транзакція',
          expenseColor: t.expenseColor || this.getThemeColor(t.category),
          tags: t.tags || [t.category].filter(Boolean),
          account: accountName,
          client: t.client || '',
          paymentType: t.paymentType || 'Звичайна',
          category: t.category || ''
        } as Transaction;
      });

      this.transactions.set(parsed);
      this.checkGoalCompletion();
    });
  }

  private getThemeColor(category: string): string {
    const colors: Record<string, string> = {
      'Оренда': '#f87171',
      'Їжа': '#fbbf24',
      'Зарплата': '#10b981',
      'Транспорт': '#818cf8',
      'Техніка': '#a78bfa'
    };
    return colors[category] || '#94a3b8';
  }

  private checkGoalCompletion() {
    const now = new Date();
    const m = now.getMonth();
    const y = now.getFullYear();
    const periodKey = `${m}-${y}`;

    const totalIncome = this.getMonthlyIncomeFactTotal();
    const mainGoal = this.userSettings().monthlyIncomeGoal;

    if (mainGoal > 0 && totalIncome >= mainGoal) {
      const goalKey = `main-${periodKey}`;
      if (!this.notifiedGoals.has(goalKey)) {
        this.toasts.show('Вітаємо! Ви досягли місячної цілі доходу!', 'success');
        this.audio.playChallengeComplete();
        this.notifiedGoals.add(goalKey);
      }
    }
  }

  private getExchangeRate(from: string, to: string): number {
    if (from === to) return 1;
    const rates: Record<string, number> = { 'UAH': 1, 'USD': 38.5, 'EUR': 41.5, 'CZK': 1.6 };
    return (rates[from] || 1) / (rates[to] || 1);
  }

  loadData() {
    const savedInc = localStorage.getItem(this.INCOME_PLANS_KEY);
    if (savedInc) this.incomePlans.set(JSON.parse(savedInc));
    else this.incomePlans.set([
      { id: '1', category: 'Індивідуальна розробка', planAmount: 80000, factAmount: 25000 },
      { id: '2', category: 'Шаблони', planAmount: 40000, factAmount: 15000 }
    ]);

    const savedExp = localStorage.getItem(this.EXPENSE_PLANS_KEY);
    if (savedExp) this.expensePlans.set(JSON.parse(savedExp));
    else this.expensePlans.set([
      { id: '1', category: 'Оренда', type: 'mandatory', amount: 15000 },
      { id: '2', category: 'Їжа', type: 'mandatory', amount: 10000 }
    ]);

    const savedAcc = localStorage.getItem(this.ACCOUNTS_KEY);
    if (savedAcc) this.accounts.set(JSON.parse(savedAcc));
    else this.accounts.set([
      { id: '1', name: 'ФОП', balance: 145000, currency: 'UAH', tags: ['Основний'], color: '#10b981' },
      { id: '2', name: 'Моно', balance: 25000, currency: 'UAH', tags: ['Особистий'], color: '#171717' }
    ]);

    const savedSubs = localStorage.getItem(this.SUBSCRIPTIONS_KEY);
    if (savedSubs) this.subscriptions.set(JSON.parse(savedSubs).map((s: any) => ({ ...s, nextPaymentDate: new Date(s.nextPaymentDate) })));
  }

  saveSettings(settings: UserSettings) { this.settingsService.saveSettings(settings); }
  saveIncomePlans(plans: IncomePlan[]) { this.incomePlans.set(plans); localStorage.setItem(this.INCOME_PLANS_KEY, JSON.stringify(plans)); }
  saveExpensePlans(plans: ExpensePlan[]) { this.expensePlans.set(plans); localStorage.setItem(this.EXPENSE_PLANS_KEY, JSON.stringify(plans)); }
  saveAccounts(accounts: AccountBalance[]) { this.accounts.set(accounts); localStorage.setItem(this.ACCOUNTS_KEY, JSON.stringify(accounts)); }

  adjustAccountBalance(accountId: string, amount: number, type: 'income' | 'expense') {
    const accs = [...this.accounts()];
    const i = accs.findIndex(a => a.id === accountId);
    if (i !== -1) {
      accs[i].balance += (type === 'income' ? amount : -amount);
      this.saveAccounts(accs);
    }
  }

  saveSubscriptions(subs: Subscription[]) { this.subscriptions.set(subs); localStorage.setItem(this.SUBSCRIPTIONS_KEY, JSON.stringify(subs)); }

  clearAllData() {
    localStorage.clear();
    this.ts.setTransactions([]);
    this.transactions.set([]);
    this.loadData();
  }

  loadMockData() {
    this.clearAllData();
    this.ts.initTransactions();
  }

  getMonthlyIncomePlanTotal(): number {
    return this.incomePlans().reduce((acc, p) => acc + p.planAmount, 0);
  }

  getMonthlyIncomeFactTotal(): number {
    const now = new Date();
    return this.transactions()
      .filter(t => t.type === 'income' && t.date.getMonth() === now.getMonth() && t.date.getFullYear() === now.getFullYear())
      .reduce((s, t) => s + t.amountUah, 0);
  }

  getTotalExpensesThisMonth(): number {
    const now = new Date();
    return this.transactions()
      .filter(t => t.type === 'expense' && t.date.getMonth() === now.getMonth() && t.date.getFullYear() === now.getFullYear())
      .reduce((s, t) => s + t.amountUah, 0);
  }

  getFinancialHistory(monthsCount: number = 6) {
    const history = [];
    const now = new Date();
    for (let i = monthsCount - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth();
      const y = d.getFullYear();

      const inc = this.transactions()
        .filter(t => t.type === 'income' && t.date.getMonth() === m && t.date.getFullYear() === y)
        .reduce((s, t) => s + t.amountUah, 0);

      const exp = this.transactions()
        .filter(t => t.type === 'expense' && t.date.getMonth() === m && t.date.getFullYear() === y)
        .reduce((s, t) => s + t.amountUah, 0);

      history.push({
        label: d.toLocaleDateString('uk-UA', { month: 'short', year: '2-digit' }),
        income: inc,
        expense: exp,
        net: inc - exp,
        incomeK: Math.round(inc / 1000),
        expenseK: Math.round(exp / 1000),
        netK: Math.round((inc - exp) / 1000)
      });
    }
    return history;
  }

  getNetGrowthPercentage(): number {
    const history = this.getFinancialHistory(2);
    if (history.length < 2) return 0;
    const current = history[1].net;
    const prev = history[0].net;
    if (prev === 0) return current > 0 ? 100 : (current < 0 ? -100 : 0);
    return ((current - prev) / Math.abs(prev)) * 100;
  }

  getExpenseTransactions() { return this.transactions().filter(t => t.type === 'expense'); }
}

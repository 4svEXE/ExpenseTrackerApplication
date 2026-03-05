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
  isRecurring: boolean; // monthly
}

export interface WishItem {
  id: string;
  name: string;
  amount: number;
  category?: string;
}

export interface ExpensePlan {
  id: string;
  category: string;
  type: 'mandatory' | 'savings' | 'unexpected';
  amount: number;
  isRecurring?: boolean; // monthly
  isCompleted?: boolean; // for one-time
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
  private readonly ACCOUNTS_KEY = 'accounts';
  private readonly EXPENSE_PLANS_KEY = 'expensePlans';
  private readonly SUBS_KEY = 'subscriptions';
  private readonly NOTIFIED_GOALS_KEY = 'notifiedGoals';
  private readonly WISHLIST_KEY = 'wishlist';

  private settingsService = inject(SettingsService);
  private ts = inject(TransactionService);
  private audio = inject(AudioService);
  private toasts = inject(ToastService);

  userSettings = this.settingsService.userSettings;

  transactions = signal<Transaction[]>([]);
  incomePlans = signal<IncomePlan[]>([]);
  expensePlans = signal<ExpensePlan[]>([]);
  wishlist = signal<WishItem[]>([]);
  accounts = signal<AccountBalance[]>([]);
  subscriptions = signal<Subscription[]>([]);

  totalBalance = computed(() => {
    const curr = this.userSettings().currency;
    return this.accounts().reduce((s, a) => {
      let b = Number(a.balance) || 0;
      if (a.currency !== curr) b *= this.getExchangeRate(a.currency, curr);
      return s + b;
    }, 0);
  });

  private notifiedGoals = new Set<string>();

  constructor() {
    this.loadData();

    this.ts.allTransactions$.subscribe(txs => {
      const parsed = (txs || []).map((t: any, i) => {
        let acc = t.account || 'Картка';
        if (t.accountId) {
          const match = this.accounts().find(a => a.id === t.accountId);
          if (match) acc = match.name;
        }

        let date: Date;
        if (typeof t.date === 'string' && t.date.includes('-') && !t.date.includes('T')) {
          const [y, m, d] = t.date.split('-').map(Number);
          date = new Date(y, m - 1, d);
        } else {
          date = new Date(t.date || new Date());
        }

        const amt = Number(t.amount) || Number(t.amountUah) || 0;

        return {
          ...t,
          id: (t.id || i).toString(),
          title: (t.description || t.title || t.category || 'Транзакція').toString(),
          date,
          amountUah: amt,
          type: (t.transactionType === 'income' || t.type === 'income') ? 'income' : 'expense',
          category: t.category || 'Інше',
          expenseColor: t.expenseColor || this.getThemeColor(t.category || ''),
          tags: Array.isArray(t.tags) ? t.tags : [t.category].filter(Boolean),
          account: acc,
          client: t.client || '',
          paymentType: t.paymentType || 'Звичайна'
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
    const period = `goal-${now.getMonth()}-${now.getFullYear()}`;
    const total = this.getMonthlyIncomeFactTotal();
    const goal = Number(this.userSettings().monthlyIncomeGoal) || 0;

    if (goal > 0 && total >= goal) {
      if (!this.notifiedGoals.has(period)) {
        this.toasts.show('Вітаємо! Ви досягли місячної цілі доходу! 🚀', 'success');
        this.audio.playChallengeComplete();
        this.notifiedGoals.add(period);
        this.saveNotifiedGoals();
      }
    }
  }

  private saveNotifiedGoals() {
    localStorage.setItem(this.NOTIFIED_GOALS_KEY, JSON.stringify(Array.from(this.notifiedGoals)));
  }

  getExchangeRate(f: string, t: string) {
    if (f === t) return 1;
    const r: any = { 'UAH': 1, 'USD': 38.5, 'EUR': 41.5, 'CZK': 1.6 };
    return (r[f] || 1) / (r[t] || 1);
  }

  addAccount(acc: Omit<AccountBalance, 'id'>) {
    const newAcc = {
      ...acc,
      id: Date.now().toString(),
      balance: Number(acc.balance) || 0
    };
    const current = this.accounts();
    this.saveAccounts([...current, newAcc]);
    this.toasts.show('Рахунок додано!', 'success');
  }

  getNetIncomeFact(): number {
    const total = this.getMonthlyIncomeFactTotal();
    const settings = this.userSettings();
    const pctTax = total * ((settings.taxRate || 0) / 100);
    const fixedTax = settings.taxFixedAmount || 0;
    return total - pctTax - fixedTax;
  }

  loadData() {
    const load = (key: string, def: any) => {
      const s = localStorage.getItem(key);
      return s ? JSON.parse(s) : def;
    };

    this.incomePlans.set(load(this.INCOME_PLANS_KEY, [
      { id: '1', category: 'Зарплата', planAmount: 80000, factAmount: 0, isRecurring: true }
    ]));
    this.expensePlans.set(load(this.EXPENSE_PLANS_KEY, [
      { id: '1', category: 'Оренда', type: 'mandatory', amount: 15000, isRecurring: true }
    ]));
    this.wishlist.set(load(this.WISHLIST_KEY, []));
    this.accounts.set(load(this.ACCOUNTS_KEY, [
      { id: '1', name: 'Картка', balance: 50000, currency: 'UAH', tags: [] }
    ]));
    this.subscriptions.set(load(this.SUBS_KEY, []).map((s: any) => ({ ...s, nextPaymentDate: new Date(s.nextPaymentDate) })));

    const savedNotified = localStorage.getItem(this.NOTIFIED_GOALS_KEY);
    if (savedNotified) {
      this.notifiedGoals = new Set(JSON.parse(savedNotified));
    }
  }

  getMonthlyIncomeFactTotal(): number {
    const now = new Date();
    return this.transactions()
      .filter(t => t.type === 'income' && t.date.getMonth() === now.getMonth() && t.date.getFullYear() === now.getFullYear())
      .reduce((s, t) => s + (Number(t.amountUah) || 0), 0);
  }

  getTaxAmount(): number {
    const total = this.getMonthlyIncomeFactTotal();
    const settings = this.userSettings();
    const pctTax = total * ((settings.taxRate || 0) / 100);
    const fixedTax = Number(settings.taxFixedAmount) || 0;
    return pctTax + fixedTax;
  }

  getPlannedExpensesTotalUah(): number {
    const plans = this.expensePlans()
      .filter(p => p.isRecurring || !p.isCompleted)
      .reduce((s, p) => s + (Number(p.amount) || 0), 0);

    const subs = this.subscriptions()
      .reduce((s, sub) => s + (Number(sub.priceUah) || 0), 0);

    return plans + subs;
  }

  getMonthlyIncomePlanTotal(): number {
    return this.incomePlans().reduce((s, p) => s + (Number(p.planAmount) || 0), 0);
  }

  getTotalExpensesThisMonth(): number {
    const now = new Date();
    return this.transactions()
      .filter(t => t.type === 'expense' && t.date.getMonth() === now.getMonth() && t.date.getFullYear() === now.getFullYear())
      .reduce((s, t) => s + (Number(t.amountUah) || 0), 0);
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
        .reduce((s, t) => s + (Number(t.amountUah) || 0), 0);

      const exp = this.transactions()
        .filter(t => t.type === 'expense' && t.date.getMonth() === m && t.date.getFullYear() === y)
        .reduce((s, t) => s + (Number(t.amountUah) || 0), 0);

      history.push({
        label: d.toLocaleDateString('uk-UA', { month: 'short' }),
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
    const h = this.getFinancialHistory(2);
    if (h.length < 2) return 0;
    const c = h[1].net;
    const p = h[0].net;
    if (p === 0) return c > 0 ? 100 : 0;
    return ((c - p) / Math.abs(p)) * 100;
  }

  saveSettings(s: UserSettings) { this.settingsService.saveSettings(s); }
  saveAccounts(a: AccountBalance[]) { this.accounts.set(a); localStorage.setItem(this.ACCOUNTS_KEY, JSON.stringify(a)); }
  saveIncomePlans(p: IncomePlan[]) { this.incomePlans.set(p); localStorage.setItem(this.INCOME_PLANS_KEY, JSON.stringify(p)); }
  saveExpensePlans(p: ExpensePlan[]) { this.expensePlans.set(p); localStorage.setItem(this.EXPENSE_PLANS_KEY, JSON.stringify(p)); }
  saveSubscriptions(s: Subscription[]) { this.subscriptions.set(s); localStorage.setItem(this.SUBS_KEY, JSON.stringify(s)); }
  saveWishlist(w: WishItem[]) { this.wishlist.set(w); localStorage.setItem(this.WISHLIST_KEY, JSON.stringify(w)); }

  adjustAccountBalance(id: string, amt: number, type: 'income' | 'expense') {
    const accs = [...this.accounts()];
    const i = accs.findIndex(a => a.id === id);
    if (i !== -1) {
      accs[i].balance = (Number(accs[i].balance) || 0) + (type === 'income' ? amt : -amt);
      this.saveAccounts(accs);
    }
  }

  addCoins(amount: number = 1) {
    if (!this.userSettings().gamificationEnabled) return;
    const settings = { ...this.userSettings() };
    settings.coins = (settings.coins || 0) + amount;
    this.saveSettings(settings);
  }

  showPlanPopup = signal(false);

  moveWishToPlan(wish: WishItem) {
    const currentPlans = [...this.expensePlans()];
    const newPlan: ExpensePlan = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      category: wish.name,
      amount: wish.amount,
      type: 'mandatory',
      isRecurring: false
    };
    this.saveExpensePlans([newPlan, ...currentPlans]);
    this.saveWishlist(this.wishlist().filter(w => w.id !== wish.id));
  }

  movePlanToWish(plan: ExpensePlan) {
    const currentWishes = [...this.wishlist()];
    const newWish: WishItem = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: plan.category,
      amount: plan.amount
    };
    this.saveWishlist([newWish, ...currentWishes]);
    this.saveExpensePlans(this.expensePlans().filter(p => p.id !== plan.id));
  }

  clearAllData() { localStorage.clear(); location.reload(); }
  loadMockData() { this.ts.initTransactions(); }
}

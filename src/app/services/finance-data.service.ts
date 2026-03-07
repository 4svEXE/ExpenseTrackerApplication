import { Injectable, signal, inject, computed, effect } from '@angular/core';
import { TransactionService } from './transaction.service';
import { AudioService } from './audio.service';
import { ToastService } from './toast.service';
import { CurrencyService } from './currency.service';
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

export interface DebtItem {
  id: string;
  name: string;
  amount: number;
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

export type SubscriptionPeriod = 'monthly' | '3months' | 'yearly' | 'custom';

export interface Subscription {
  id: string;
  name: string;
  price: number;
  currency: string;
  priceUah: number;
  priceEur?: number;
  period: SubscriptionPeriod;
  customDays?: number;
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
  private readonly DEBTS_KEY = 'debts';

  private settingsService = inject(SettingsService);
  private ts = inject(TransactionService);
  private audio = inject(AudioService);
  public toasts = inject(ToastService);
  private currencyService = inject(CurrencyService);

  userSettings = this.settingsService.userSettings;

  transactions = signal<Transaction[]>([]);
  incomePlans = signal<IncomePlan[]>([]);
  expensePlans = signal<ExpensePlan[]>([]);
  wishlist = signal<WishItem[]>([]);
  debts = signal<DebtItem[]>([]);
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

  constructor() {
    this.loadData();

    effect(() => {
      const txs = this.ts.allTransactions();
      const parsed = (txs || []).map((t: any, i: number) => {
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

        let amt = Number(t.amount) || Number(t.amountUah) || 0;
        if (t.accountId) {
          const match = this.accounts().find(a => a.id === t.accountId);
          if (match && match.currency !== 'UAH') {
            amt = amt * this.getExchangeRate(match.currency, 'UAH');
          }
        }

        return {
          ...t,
          id: (t.id || i).toString(),
          title: (t.description || t.title || t.category || 'Транзакція').toString(),
          date,
          amountUah: amt,
          amountEur: amt / this.getExchangeRate('EUR', 'UAH'),
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

  getExchangeRate(f: string, t: string) {
    return this.currencyService.getExchangeRate(f, t);
  }

  getCurrencySymbol(currency: string): string {
    return this.currencyService.getCurrencySymbol(currency);
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
      { id: '1', category: 'Зарплата', planAmount: 8000, factAmount: 0, isRecurring: true }
    ]));
    this.expensePlans.set(load(this.EXPENSE_PLANS_KEY, [
      { id: '1', category: 'Оренда', type: 'mandatory', amount: 1500, isRecurring: true }
    ]));
    this.wishlist.set(load(this.WISHLIST_KEY, []));
    this.debts.set(load(this.DEBTS_KEY, []));
    this.accounts.set(load(this.ACCOUNTS_KEY, [
      { id: '1', name: 'Картка', balance: 5000, currency: 'UAH', tags: [] }
    ]));
    this.subscriptions.set(load(this.SUBS_KEY, []).map((s: any) => ({
      ...s,
      nextPaymentDate: new Date(s.nextPaymentDate),
      price: s.price || s.priceUah || 0,
      currency: s.currency || 'UAH',
      period: s.period || 'monthly'
    })));
  }

  getMonthlyIncomeFactTotal(): number {
    const now = new Date();
    const uah = this.transactions()
      .filter(t => t.type === 'income' && t.date.getMonth() === now.getMonth() && t.date.getFullYear() === now.getFullYear())
      .reduce((s, t) => s + (Number(t.amountUah) || 0), 0);
    return uah * this.getExchangeRate('UAH', this.userSettings().currency);
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
    const uah = this.transactions()
      .filter(t => t.type === 'expense' && t.date.getMonth() === now.getMonth() && t.date.getFullYear() === now.getFullYear())
      .reduce((s, t) => s + (Number(t.amountUah) || 0), 0);
    return uah * this.getExchangeRate('UAH', this.userSettings().currency);
  }

  getFinancialHistory(monthsCount: number = 6) {
    const history = [];
    const now = new Date();
    for (let i = monthsCount - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth();
      const y = d.getFullYear();

      const incUah = this.transactions()
        .filter(t => t.type === 'income' && t.date.getMonth() === m && t.date.getFullYear() === y)
        .reduce((s, t) => s + (Number(t.amountUah) || 0), 0);

      const expUah = this.transactions()
        .filter(t => t.type === 'expense' && t.date.getMonth() === m && t.date.getFullYear() === y)
        .reduce((s, t) => s + (Number(t.amountUah) || 0), 0);

      const rate = this.getExchangeRate('UAH', this.userSettings().currency);
      const inc = incUah * rate;
      const exp = expUah * rate;

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
  saveDebts(d: DebtItem[]) { this.debts.set(d); localStorage.setItem(this.DEBTS_KEY, JSON.stringify(d)); }

  adjustAccountBalance(id: string, amt: number, type: 'income' | 'expense') {
    const accs = [...this.accounts()];
    const i = accs.findIndex(a => a.id === id);
    if (i !== -1) {
      accs[i].balance = (Number(accs[i].balance) || 0) + (type === 'income' ? amt : -amt);
      this.saveAccounts(accs);
    }
  }

  executeDebt(debtId: string, accountId: string, customAmount?: number) {
    const debt = this.debts().find(d => d.id === debtId);
    if (!debt) return;

    // Use absolute amount for the transaction
    const finalAmount = customAmount !== undefined ? Math.abs(customAmount) : Math.abs(debt.amount);
    const type = debt.amount < 0 ? 'expense' : 'income';

    // 1. Add Transaction
    this.ts.addTransaction({
      amount: finalAmount,
      category: 'Борг: ' + debt.name,
      date: new Date().toISOString(),
      description: 'Виконання боргу ' + debt.name,
      transactionType: type,
      accountId: accountId,
      debtId: debt.id,
      debtName: debt.name,
      debtAmount: debt.amount
    });

    // 2. Adjust Balance
    this.adjustAccountBalance(accountId, finalAmount, type);

    // 3. Remove Debt (or partial payment? User said "disappears after full payoff", but let's assume one-shot for now as per "disappears")
    const remaining = this.debts().filter(d => d.id !== debtId);
    this.saveDebts(remaining);

    this.toasts.show('Борг виконано!', 'success');

    // 4. Audio Feedback
    if (type === 'income') {
      this.audio.playIncome();
    } else {
      this.audio.playOutcome();
    }
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

  exportData() {
    const data: Record<string, any> = {};
    const keys = [
      this.INCOME_PLANS_KEY, this.ACCOUNTS_KEY, this.EXPENSE_PLANS_KEY,
      this.SUBS_KEY, this.NOTIFIED_GOALS_KEY, this.WISHLIST_KEY,
      this.DEBTS_KEY, 'userSettings', 'Transactions', 'Categories'
    ];

    keys.forEach(key => {
      const val = localStorage.getItem(key);
      if (val) data[key] = JSON.parse(val);
    });

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eta_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    this.toasts.show('Експорт завершено!', 'success');
  }

  async importData(file: File) {
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      Object.entries(data).forEach(([key, val]) => {
        localStorage.setItem(key, JSON.stringify(val));
      });

      this.toasts.show('Дані імпортовано! Додаток перезавантажиться...', 'success');
      setTimeout(() => location.reload(), 1500);
    } catch (e) {
      this.toasts.show('Помилка при імпорті даних!', 'error');
    }
  }
  getExpensePlansWithFact() {
    const now = new Date();
    const txs = this.transactions().filter(t =>
      t.type === 'expense' &&
      t.date.getMonth() === now.getMonth() &&
      t.date.getFullYear() === now.getFullYear()
    );

    const rateToUser = this.getExchangeRate('UAH', this.userSettings().currency);

    return this.expensePlans().map(plan => {
      let fact = 0;
      const planCat = (plan.category || '').toLowerCase();
      if (planCat.includes('податки')) {
        fact = this.getTaxAmount();
      } else {
        const matched = txs.filter(t =>
          (t.category && t.category.toLowerCase() === planCat) ||
          (t.tags && t.tags.some(tag => (tag || '').toLowerCase() === planCat)) ||
          (t.title && t.title.toLowerCase().includes(planCat))
        );
        fact = matched.reduce((acc, t) => acc + ((t.amountUah || 0) * rateToUser), 0);
      }
      return { ...plan, factAmount: fact };
    });
  }

  getIncomePlansWithFact() {
    const now = new Date();
    const txs = this.transactions().filter(t =>
      t.type === 'income' &&
      t.date.getMonth() === now.getMonth() &&
      t.date.getFullYear() === now.getFullYear()
    );

    const rateToUser = this.getExchangeRate('UAH', this.userSettings().currency);

    return this.incomePlans().map(plan => {
      const planCat = (plan.category || '').toLowerCase();
      const matched = txs.filter(t =>
        (t.category && t.category.toLowerCase() === planCat) ||
        (t.tags && t.tags.some(tag => (tag || '').toLowerCase() === planCat)) ||
        (t.title && t.title.toLowerCase().includes(planCat))
      );
      const fact = matched.reduce((acc, t) => acc + ((t.amountUah || 0) * rateToUser), 0);
      return { ...plan, factAmount: fact };
    });
  }
}

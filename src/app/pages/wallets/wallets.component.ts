import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AccountsListComponent } from '../../components/dashboard/accounts-list/accounts-list.component';
import { SubscriptionsListComponent } from '../../components/dashboard/subscriptions-list/subscriptions-list.component';
import { FinanceDataService, AccountBalance, Subscription } from '../../services/finance-data.service';

@Component({
  selector: 'app-wallets',
  standalone: true,
  imports: [CommonModule, FormsModule, AccountsListComponent, SubscriptionsListComponent],
  template: `
    <div class="wallets-wrapper min-h-screen bg-slate-50/50 p-2 md:p-8 font-sans pb-24">
      <div class="max-w-[1200px] mx-auto space-y-6 md:space-y-8">
        <div class="flex items-center gap-3 mb-6 md:mb-10">
          <h2 class="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <i class="fa-solid fa-wallet text-neutral-400"></i>
            Гаманці та Підписки
          </h2>
          <div class="h-px bg-slate-200 flex-1"></div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          <app-accounts-list (accountClicked)="editAccount($event)"></app-accounts-list>
          <app-subscriptions-list (subscriptionClicked)="editSubscription($event)"></app-subscriptions-list>
        </div>

        <div class="p-8 bg-neutral-900 rounded-3xl text-white shadow-2xl relative overflow-hidden group">
          <div class="absolute -right-20 -top-20 w-64 h-64 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-all"></div>
          <div class="relative z-10">
            <h3 class="text-xl font-bold mb-2">Налаштування</h3>
            <p class="text-neutral-400 text-sm mb-6">Додавайте нові рахунки або підписки для повного контролю над грошима.</p>
            <div class="flex gap-4">
              <button (click)="openAddAccountModal()" class="px-6 py-3 bg-white text-black rounded-xl font-bold hover:bg-neutral-200 active:scale-[0.98] transition-all dropdown-shadow">
                Додати рахунок
              </button>
              <button (click)="openAddSubscriptionModal()" class="px-6 py-3 bg-neutral-800 border border-neutral-700 text-white rounded-xl font-bold hover:bg-neutral-700 active:scale-[0.98] transition-all">
                Додати підписку
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal for Adding / Editing Account -->
    <div *ngIf="isModalOpen()" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in duration-200">
        <div class="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 class="text-xl font-bold text-slate-900">{{ isEditMode() ? 'Редагувати рахунок' : 'Новий рахунок' }}</h3>
          <button (click)="closeModal()" class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400">
            <i class="fa-solid fa-times"></i>
          </button>
        </div>

        <div class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-semibold text-slate-600 mb-1">Назва рахунку</label>
            <input [(ngModel)]="newAccount.name" type="text" placeholder="Наприклад: Monobank Біла Картка" 
              class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all font-medium text-black">
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-semibold text-slate-600 mb-1">Баланс</label>
              <input [(ngModel)]="newAccount.balance" type="number" placeholder="0.00" 
                class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all font-medium text-black">
            </div>
            <div>
              <label class="block text-sm font-semibold text-slate-600 mb-1">Валюта</label>
              <select [(ngModel)]="newAccount.currency" class="w-full px-4 py-3 text-black rounded-xl bg-slate-50 border border-slate-200 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all font-medium">
                <option *ngFor="let c of currencies" [value]="c">{{ c }}</option>
              </select>
            </div>
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-semibold text-slate-600 mb-1">Теги (через кому)</label>
              <input [(ngModel)]="newAccountTags" type="text" placeholder="Щоденні витрати..." 
                class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all font-medium text-black">
            </div>
            <div>
              <label class="block text-sm font-semibold text-slate-600 mb-1">Колір Картки</label>
              <input [(ngModel)]="newAccount.color" type="color"
                class="w-full h-[48px] p-1 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
            </div>
          </div>
        </div>

        <div class="p-6 bg-slate-50 flex gap-3">
          <button *ngIf="isEditMode()" (click)="deleteAccount()" class="py-4 px-4 rounded-xl font-bold bg-red-100 text-red-600 hover:bg-red-200 transition-all">
            <i class="fa-solid fa-trash"></i>
          </button>
          <button (click)="closeModal()" class="flex-1 py-4 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-all">
            Скасувати
          </button>
          <button (click)="saveAccount()" [disabled]="!newAccount.name || newAccount.name.trim() === ''"
            class="flex-1 py-4 rounded-xl font-bold bg-black text-white shadow-xl hover:bg-neutral-800 active:scale-[0.98] transition-all disabled:opacity-50">
            Зберегти
          </button>
        </div>
      </div>
    </div>

    <!-- Modal for Adding / Editing Subscription -->
    <div *ngIf="isSubModalOpen()" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in duration-200">
        <div class="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 class="text-xl font-bold text-slate-900">{{ isSubEditMode() ? 'Редагувати підписку' : 'Нова підписка' }}</h3>
          <button (click)="closeSubModal()" class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400">
            <i class="fa-solid fa-times"></i>
          </button>
        </div>

        <div class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-semibold text-slate-600 mb-1">Сервіс (Назва)</label>
            <input [(ngModel)]="newSub.name" type="text" placeholder="Наприклад: Netflix" 
              class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all font-medium text-black">
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-semibold text-slate-600 mb-1">Ціна (UAH)</label>
              <input [(ngModel)]="newSub.priceUah" type="number" placeholder="0" 
                class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all font-medium text-black">
            </div>
            <div>
              <label class="block text-sm font-semibold text-slate-600 mb-1">Дата наст. платежу</label>
              <input [(ngModel)]="newSubDate" type="date"
                class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all font-medium text-black">
            </div>
          </div>

        </div>

        <div class="p-6 bg-slate-50 flex gap-3">
          <button *ngIf="isSubEditMode()" (click)="deleteSubscription()" class="py-4 px-4 rounded-xl font-bold bg-red-100 text-red-600 hover:bg-red-200 transition-all">
            <i class="fa-solid fa-trash"></i>
          </button>
          <button (click)="closeSubModal()" class="flex-1 py-4 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-all">
            Скасувати
          </button>
          <button (click)="saveSubscription()" [disabled]="!newSub.name || newSub.name.trim() === ''"
            class="flex-1 py-4 rounded-xl font-bold bg-black text-white shadow-xl hover:bg-neutral-800 active:scale-[0.98] transition-all disabled:opacity-50">
            Зберегти
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
    @keyframes zoom-in {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
    .animate-in {
      animation: zoom-in 0.2s ease-out;
    }
  `]
})
export class WalletsComponent {
  financeData = inject(FinanceDataService);

  // Account Modal State
  isModalOpen = signal(false);
  isEditMode = signal(false);

  // Subscription Modal State
  isSubModalOpen = signal(false);
  isSubEditMode = signal(false);

  currencies = ['UAH', 'USD', 'EUR', 'CZK'];

  newAccount: Partial<AccountBalance> = {};
  newAccountTags = '';

  newSub: Partial<Subscription> = {};
  newSubDate = '';

  // ==== ACCOUNTS CRUD ====
  openAddAccountModal() {
    this.resetForm();
    this.isEditMode.set(false);
    this.isModalOpen.set(true);
  }

  editAccount(acc: AccountBalance) {
    this.newAccount = { ...acc };
    this.newAccountTags = (acc.tags || []).join(', ');
    this.isEditMode.set(true);
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.resetForm();
  }

  saveAccount() {
    if (!this.newAccount.name?.trim()) return;

    const tags = this.newAccountTags.split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const accountToSave: AccountBalance = {
      id: this.newAccount.id || Date.now().toString(),
      name: this.newAccount.name.trim(),
      balance: this.newAccount.balance || 0,
      currency: this.newAccount.currency || this.financeData.userSettings().currency,
      tags: tags,
      color: this.newAccount.color || '#171717'
    };

    let accounts = [...this.financeData.accounts()];
    if (this.isEditMode()) {
      const idx = accounts.findIndex(a => a.id === accountToSave.id);
      if (idx !== -1) accounts[idx] = accountToSave;
    } else {
      accounts.push(accountToSave);
    }

    this.financeData.saveAccounts(accounts);
    this.closeModal();
  }

  deleteAccount() {
    if (!this.newAccount.id) return;
    const accounts = this.financeData.accounts().filter(a => a.id !== this.newAccount.id);
    this.financeData.saveAccounts(accounts);
    this.closeModal();
  }

  resetForm() {
    this.newAccount = {
      name: '',
      balance: 0,
      currency: this.financeData.userSettings().currency,
      color: '#171717'
    };
    this.newAccountTags = '';
  }

  // ==== SUBSCRIPTIONS CRUD ====
  openAddSubscriptionModal() {
    this.resetSubForm();
    this.isSubEditMode.set(false);
    this.isSubModalOpen.set(true);
  }

  editSubscription(sub: Subscription) {
    this.newSub = { ...sub };
    if (sub.nextPaymentDate) {
      this.newSubDate = new Date(sub.nextPaymentDate).toISOString().split('T')[0];
    }
    this.isSubEditMode.set(true);
    this.isSubModalOpen.set(true);
  }

  closeSubModal() {
    this.isSubModalOpen.set(false);
    this.resetSubForm();
  }

  saveSubscription() {
    if (!this.newSub.name?.trim()) return;

    const subToSave: Subscription = {
      id: this.newSub.id || Date.now().toString(),
      name: this.newSub.name.trim(),
      priceUah: this.newSub.priceUah || 0,
      priceEur: this.newSub.priceEur,
      nextPaymentDate: this.newSubDate ? new Date(this.newSubDate) : new Date(),
      totalSpent: this.newSub.totalSpent || 0
    };

    let subs = [...this.financeData.subscriptions()];
    if (this.isSubEditMode()) {
      const idx = subs.findIndex(s => s.id === subToSave.id);
      if (idx !== -1) subs[idx] = subToSave;
    } else {
      subs.push(subToSave);
    }

    this.financeData.saveSubscriptions(subs);
    this.closeSubModal();
  }

  deleteSubscription() {
    if (!this.newSub.id) return;
    const subs = this.financeData.subscriptions().filter(s => s.id !== this.newSub.id);
    this.financeData.saveSubscriptions(subs);
    this.closeSubModal();
  }

  resetSubForm() {
    this.newSub = {
      name: '',
      priceUah: 0,
      totalSpent: 0
    };
    this.newSubDate = new Date().toISOString().split('T')[0];
  }
}

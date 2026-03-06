import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AccountsListComponent } from '../../components/dashboard/accounts-list/accounts-list.component';
import { SubscriptionsListComponent } from '../../components/dashboard/subscriptions-list/subscriptions-list.component';
import { FinanceDataService, AccountBalance, Subscription, IncomePlan, ExpensePlan, SubscriptionPeriod } from '../../services/finance-data.service';
import { ConfirmService } from '../../services/confirm.service';

@Component({
  selector: 'app-wallets',
  standalone: true,
  imports: [CommonModule, FormsModule, AccountsListComponent, SubscriptionsListComponent],
  template: `
    <div class="wallets-wrapper min-h-screen bg-slate-50/50 p-2 md:p-8 font-sans pb-24">
      <div class="max-w-[1200px] mx-auto space-y-6 md:space-y-8 pb-10">
        <div class="flex items-center gap-3 mb-6 md:mb-10">
          <h2 class="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <i class="fa-solid fa-wallet text-neutral-400"></i>
            Гаманці та Підписки
          </h2>
          <div class="h-px bg-slate-200 flex-1"></div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          <app-accounts-list (accountClicked)="editAccount($event)" (addAccountClicked)="openAddAccountModal()"></app-accounts-list>
          <app-subscriptions-list (subscriptionClicked)="editSubscription($event)" (addSubscriptionClicked)="openAddSubscriptionModal()"></app-subscriptions-list>
        </div>

        <!-- Керування планами -->
        <div class="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 mt-8">
            <h3 class="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <div class="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-black shadow-sm border border-slate-200">
                  <i class="fa-solid fa-chart-pie"></i>
                </div>
                Фінансові Плани
            </h3>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <!-- Income Plans -->
              <div>
                  <div class="flex justify-between items-center mb-4">
                      <h4 class="font-bold text-slate-700">Планові доходи</h4>
                      <button (click)="addIncomePlan()"
                          class="bg-black text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-neutral-800 transition-all flex items-center gap-2">
                          <i class="fa-solid fa-plus text-[10px]"></i> Додати
                      </button>
                  </div>
                  <div class="space-y-4">
                      <div *ngFor="let plan of incomePlans; let i = index"
                          class="relative bg-slate-50 p-4 rounded-2xl border-2 transition-all duration-300 flex flex-col gap-3"
                          [class.border-emerald-500]="plan.isNew" 
                          [class.border-slate-100]="!plan.isNew">
                          <div class="flex gap-3">
                            <div class="flex-1">
                                <label class="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Категорія</label>
                                <input type="text" [(ngModel)]="plan.category" (change)="saveIncomePlans()" placeholder="Зарплата..."
                                    class="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-bold outline-none focus:border-black text-black">
                            </div>
                            <div class="w-24">
                                <label class="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Сума</label>
                                <input type="number" [(ngModel)]="plan.planAmount" (change)="saveIncomePlans()" placeholder="0"
                                    class="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-bold outline-none focus:border-black text-black">
                            </div>
                          </div>
                          <div class="flex items-center justify-between mt-1">
                            <label class="flex items-center gap-2 cursor-pointer ml-2 pl-2">
                                <input type="checkbox" [(ngModel)]="plan.isRecurring" (change)="saveIncomePlans()"
                                    class="w-4 h-4 rounded border-slate-300 text-black focus:ring-black">
                                <span class="text-[10px] font-bold text-slate-500 uppercase">Повтор кожного місяця</span>
                            </label>
                            <button (click)="removeIncomePlan(i)"
                                class="text-rose-500 hover:text-rose-700 transition-colors p-2">
                                <i class="fa-solid fa-trash-can"></i>
                            </button>
                          </div>
                      </div>
                      <div *ngIf="incomePlans.length === 0"
                          class="text-sm text-slate-400 text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                          Немає планів доходів. Почніть планувати свій бюджет!
                      </div>
                  </div>
              </div>

              <!-- Expense Plans -->
              <div>
                  <div class="flex justify-between items-center mb-4">
                      <h4 class="font-bold text-slate-700">Планові витрати</h4>
                      <button (click)="addExpensePlan()"
                          class="bg-black text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-neutral-800 transition-all flex items-center gap-2">
                          <i class="fa-solid fa-plus text-[10px]"></i> Додати
                      </button>
                  </div>
                  <div class="space-y-4">
                      <div *ngFor="let plan of expensePlans; let i = index"
                          class="relative bg-slate-50 p-4 rounded-2xl border-2 transition-all duration-300 flex flex-col gap-3"
                          [class.border-emerald-500]="plan.isNew" 
                          [class.border-slate-100]="!plan.isNew">
                          <div class="flex gap-3">
                            <div class="flex-1">
                                <label class="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Категорія</label>
                                <input type="text" [(ngModel)]="plan.category" (change)="saveExpensePlans()" placeholder="Оренда..."
                                    class="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-bold outline-none focus:border-black text-black">
                            </div>
                            <div class="w-24">
                                <label class="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Сума</label>
                                <input type="number" [(ngModel)]="plan.amount" (change)="saveExpensePlans()" placeholder="0"
                                    class="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-bold outline-none focus:border-black text-black">
                            </div>
                          </div>
                          <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Тип</label>
                                <select [(ngModel)]="plan.type" (change)="saveExpensePlans()"
                                    class="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-bold text-slate-600 outline-none focus:border-black">
                                    <option value="mandatory">Обов'язкові</option>
                                    <option value="savings">Заощадження</option>
                                    <option value="unexpected">Непередбачені</option>
                                </select>
                            </div>
                            <div class="flex items-center justify-end gap-2 pb-1">
                                <label class="flex items-center gap-2 cursor-pointer mt-5 ml-4 mr-2 pl-2">
                                    <input type="checkbox" [(ngModel)]="plan.isRecurring" (change)="saveExpensePlans()"
                                        class="w-4 h-4 rounded border-slate-300 text-black focus:ring-black">
                                    <span class="text-[10px] font-bold text-slate-500 uppercase">Повтор</span>
                                </label>
                                <button (click)="movePlanToWish(plan)" title="У вішліст"
                                    class="text-black hover:text-neutral-600 transition-colors p-2 mt-5">
                                    <i class="fa-solid fa-gift"></i>
                                </button>
                                <button (click)="removeExpensePlan(i)"
                                    class="text-rose-500 hover:text-rose-700 transition-colors p-2 mt-5">
                                    <i class="fa-solid fa-trash-can"></i>
                                </button>
                            </div>
                          </div>
                      </div>
                      <div *ngIf="expensePlans.length === 0"
                          class="text-sm text-slate-400 text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                          Немає планів витрат. Додайте обов'язкові платежі або заощадження.
                      </div>
                  </div>
              </div>
            </div>
        </div>

        <!-- Вішліст -->
        <div class="bg-black rounded-3xl p-6 md:p-8 shadow-xl text-white mt-8 relative overflow-hidden">
            <div class="absolute -right-10 -top-10 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
            
            <div class="flex justify-between items-center mb-6 relative z-10">
                <h3 class="text-xl font-bold flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-slate-200 shadow-sm border border-white/10">
                      <i class="fa-solid fa-gift"></i>
                    </div>
                    Вішліст (Мрії)
                </h3>
                <button (click)="addWish()"
                    class="bg-white text-black px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-100 transition-all flex items-center gap-2">
                    <i class="fa-solid fa-plus text-[10px]"></i> Додати мрію
                </button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
                <div *ngFor="let wish of wishlist(); let i = index" 
                     class="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex flex-col gap-3 group">
                    <input [(ngModel)]="wish.name" (change)="saveWishlist()" placeholder="Що ви хочете?"
                           class="bg-transparent border-none text-white font-bold placeholder:text-white/40 focus:ring-0 p-0 text-sm">
                    
                    <div class="flex items-center justify-between mt-auto">
                        <div class="flex items-center gap-2">
                            <span class="text-[10px] text-white/50 font-bold uppercase">Сума:</span>
                            <input type="number" [(ngModel)]="wish.amount" (change)="saveWishlist()"
                                   class="bg-transparent border-none text-white font-black p-0 w-20 text-sm focus:ring-0">
                        </div>
                        <div class="flex gap-2">
                            <button (click)="moveWishToPlan(wish)" title="В план витрат"
                                    class="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/40 transition-colors flex items-center justify-center">
                                <i class="fa-solid fa-arrow-up"></i>
                            </button>
                            <button (click)="removeWish(i)"
                                    class="w-8 h-8 rounded-lg bg-white/5 text-white/30 hover:bg-white/20 hover:text-white/60 transition-colors flex items-center justify-center">
                                <i class="fa-solid fa-trash-can text-xs"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <div *ngIf="wishlist().length === 0" 
                     class="col-span-full py-12 text-center bg-white/5 rounded-2xl border border-dashed border-white/10">
                    <p class="text-white/40 text-sm font-bold">У вас ще немає мрій? Подумайте, що б ви хотіли купити! ✨</p>
                </div>
            </div>
        </div>

        <!-- Борги -->
        <div class="bg-rose-950 rounded-3xl p-6 md:p-8 shadow-xl text-white mt-8 relative overflow-hidden">
            <div class="absolute -right-10 -top-10 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
            
            <div class="flex justify-between items-center mb-6 relative z-10">
                <h3 class="text-xl font-bold flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-slate-200 shadow-sm border border-white/10">
                      <i class="fa-solid fa-hand-holding-dollar"></i>
                    </div>
                    Борги (Зобов'язання)
                </h3>
                <button (click)="addDebt()"
                    class="bg-white text-rose-950 px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-100 transition-all flex items-center gap-2">
                    <i class="fa-solid fa-plus text-[10px]"></i> Додати борг
                </button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
                <div *ngFor="let debt of debts(); let i = index" 
                     class="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex flex-col gap-3 group">
                    <input [(ngModel)]="debt.name" (change)="saveDebts()" placeholder="Кому ви винні?"
                           class="bg-transparent border-none text-white font-bold placeholder:text-white/40 focus:ring-0 p-0 text-sm">
                    
                    <div class="flex items-center justify-between mt-auto">
                        <div class="flex items-center gap-2">
                            <span class="text-[10px] text-white/50 font-bold uppercase">Сума:</span>
                            <input type="number" [(ngModel)]="debt.amount" (change)="saveDebts()"
                                   class="bg-transparent border-none text-white font-black p-0 w-20 text-sm focus:ring-0">
                        </div>
                        <div class="flex gap-2">
                            <button (click)="removeDebt(i)"
                                    class="w-8 h-8 rounded-lg bg-white/5 text-white/30 hover:bg-white/20 hover:text-white/60 transition-colors flex items-center justify-center">
                                <i class="fa-solid fa-trash-can text-xs"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <div *ngIf="debts().length === 0" 
                     class="col-span-full py-12 text-center bg-white/5 rounded-2xl border border-dashed border-white/10">
                    <p class="text-white/40 text-sm font-bold">Боргів немає. Ви вільні як вітер! 🕊️</p>
                </div>
            </div>
        </div>

        <div class="p-8 bg-neutral-900 hidden rounded-3xl text-white shadow-2xl relative overflow-hidden group">
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
              <label class="block text-sm font-semibold text-slate-600 mb-1">Ціна</label>
              <input [(ngModel)]="newSub.price" type="number" placeholder="0" 
                class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all font-medium text-black">
            </div>
            <div>
              <label class="block text-sm font-semibold text-slate-600 mb-1">Валюта</label>
              <select [(ngModel)]="newSub.currency" class="w-full px-4 py-3 text-black rounded-xl bg-slate-50 border border-slate-200 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all font-medium">
                <option *ngFor="let c of currencies" [value]="c">{{ c }}</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-semibold text-slate-600 mb-1">Періодичність</label>
              <select [(ngModel)]="newSub.period" class="w-full px-4 py-3 text-black rounded-xl bg-slate-50 border border-slate-200 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all font-medium">
                <option value="monthly">Раз в місяць</option>
                <option value="3months">Раз в 3 місяці</option>
                <option value="yearly">Раз в рік</option>
                <option value="custom">Кастомно</option>
              </select>
            </div>
            <div *ngIf="newSub.period === 'custom'">
              <label class="block text-sm font-semibold text-slate-600 mb-1">Днів (Кастомно)</label>
              <input [(ngModel)]="newSub.customDays" type="number" placeholder="30" 
                class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all font-medium text-black">
            </div>
            <div *ngIf="newSub.period !== 'custom'">
              <label class="block text-sm font-semibold text-slate-600 mb-1">Дата наст. платежу</label>
              <input [(ngModel)]="newSubDate" type="date"
                class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all font-medium text-black">
            </div>
          </div>

          <div *ngIf="newSub.period === 'custom'">
              <label class="block text-sm font-semibold text-slate-600 mb-1">Дата наст. платежу</label>
              <input [(ngModel)]="newSubDate" type="date"
                class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all font-medium text-black">
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
export class WalletsComponent implements OnInit {
  financeData = inject(FinanceDataService);
  confirmService = inject(ConfirmService);

  incomePlans: (IncomePlan & { isNew?: boolean })[] = [];
  expensePlans: (ExpensePlan & { isNew?: boolean })[] = [];
  wishlist = this.financeData.wishlist;
  debts = this.financeData.debts;

  ngOnInit() {
    this.loadPlans();
  }

  loadPlans() {
    this.incomePlans = JSON.parse(JSON.stringify(this.financeData.incomePlans()));
    this.expensePlans = JSON.parse(JSON.stringify(this.financeData.expensePlans()));
  }

  saveIncomePlans() {
    this.financeData.saveIncomePlans(this.incomePlans);
  }

  saveExpensePlans() {
    this.financeData.saveExpensePlans(this.expensePlans);
  }

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

  async deleteAccount() {
    if (!this.newAccount.id) return;
    if (await this.confirmService.confirm(`Ви впевнені, що хочете видалити рахунок "${this.newAccount.name}"?`)) {
      const accounts = this.financeData.accounts().filter(a => a.id !== this.newAccount.id);
      this.financeData.saveAccounts(accounts);
      this.closeModal();
    }
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

    const price = this.newSub.price || 0;
    const currency = this.newSub.currency || 'UAH';

    const rateToUah = this.financeData.getExchangeRate(currency, 'UAH');
    const rateToEur = this.financeData.getExchangeRate('EUR', 'UAH'); // The logic in service is (r[f] || 1) / (r[t] || 1)

    // Wait, let's check getExchangeRate again
    // getExchangeRate(f, t) => (r[f]/r[t])
    // So UAH -> EUR => getExchangeRate('UAH', 'EUR') => 1 / 41.5 = 0.024
    // currency -> UAH => getExchangeRate(currency, 'UAH') => r[currency] / 1
    // currency -> EUR => getExchangeRate(currency, 'EUR') => r[currency] / 41.5

    const subToSave: Subscription = {
      id: this.newSub.id || Date.now().toString(),
      name: this.newSub.name.trim(),
      price: price,
      currency: currency,
      priceUah: price * this.financeData.getExchangeRate(currency, 'UAH'),
      priceEur: price * this.financeData.getExchangeRate(currency, 'EUR'),
      period: this.newSub.period || 'monthly',
      customDays: this.newSub.customDays,
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

  async deleteSubscription() {
    if (!this.newSub.id) return;
    if (await this.confirmService.confirm(`Ви впевнені, що хочете видалити підписку "${this.newSub.name}"?`)) {
      const subs = this.financeData.subscriptions().filter(s => s.id !== this.newSub.id);
      this.financeData.saveSubscriptions(subs);
      this.closeSubModal();
    }
  }

  resetSubForm() {
    this.newSub = {
      name: '',
      price: 0,
      currency: 'UAH',
      period: 'monthly',
      totalSpent: 0
    };
    this.newSubDate = new Date().toISOString().split('T')[0];
  }

  // ==== PLANNING CRUD ====
  addIncomePlan() {
    const newId = Date.now().toString();
    this.incomePlans.unshift({
      id: newId,
      category: '',
      planAmount: 0,
      factAmount: 0,
      isRecurring: true,
      isNew: true
    });
    setTimeout(() => {
      const p = this.incomePlans.find(x => x.id === newId);
      if (p) p.isNew = false;
    }, 3000);
  }

  async removeIncomePlan(index: number) {
    const plan = this.incomePlans[index];
    if (await this.confirmService.confirm(`Видалити план доходу "${plan.category || 'Без назви'}"?`)) {
      this.incomePlans.splice(index, 1);
      this.saveIncomePlans();
    }
  }

  addExpensePlan() {
    const newId = Date.now().toString();
    this.expensePlans.unshift({
      id: newId,
      category: '',
      type: 'mandatory',
      amount: 0,
      isRecurring: true,
      isNew: true
    });
    setTimeout(() => {
      const p = this.expensePlans.find(x => x.id === newId);
      if (p) p.isNew = false;
    }, 3000);
  }

  async removeExpensePlan(index: number) {
    const plan = this.expensePlans[index];
    if (await this.confirmService.confirm(`Видалити план витрат "${plan.category || 'Без назви'}"?`)) {
      this.expensePlans.splice(index, 1);
      this.saveExpensePlans();
    }
  }

  // ==== WISHLIST ====
  addWish() {
    const wishes = [...this.wishlist()];
    wishes.unshift({
      id: Date.now().toString(),
      name: '',
      amount: 0
    });
    this.financeData.saveWishlist(wishes);
  }

  async removeWish(index: number) {
    const wishes = [...this.wishlist()];
    const wish = wishes[index];
    if (await this.confirmService.confirm(`Видалити мрію "${wish.name || 'Без назви'}"?`)) {
      wishes.splice(index, 1);
      this.financeData.saveWishlist(wishes);
    }
  }

  saveWishlist() {
    this.financeData.saveWishlist(this.wishlist());
  }

  // ==== DEBTS ====
  addDebt() {
    const d = [...this.debts()];
    d.unshift({
      id: Date.now().toString(),
      name: '',
      amount: 0
    });
    this.financeData.saveDebts(d);
  }

  async removeDebt(index: number) {
    const d = [...this.debts()];
    const item = d[index];
    if (await this.confirmService.confirm(`Видалити борг "${item.name || 'Без назви'}"?`)) {
      d.splice(index, 1);
      this.financeData.saveDebts(d);
    }
  }

  saveDebts() {
    this.financeData.saveDebts(this.debts());
  }

  moveWishToPlan(wish: any) {
    this.financeData.moveWishToPlan(wish);
    this.loadPlans();
  }

  movePlanToWish(plan: any) {
    this.financeData.movePlanToWish(plan);
    this.loadPlans();
  }
}

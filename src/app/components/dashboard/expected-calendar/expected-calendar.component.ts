import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceDataService, ExpectedEvent } from '../../../services/finance-data.service';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  incomeUrl?: string; // dummy for typing if needed
  totalIncome: number;
  totalExpense: number;
}

@Component({
  selector: 'app-expected-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [DatePipe],
  template: `
    <div class="card-container border-t-4 border-t-indigo-600 flex flex-col h-full bg-white rounded-3xl p-4 md:p-6 shadow-sm border border-slate-100 mt-4 md:mt-8">
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-lg md:text-xl font-bold text-slate-800 flex items-center gap-2">
          <i class="fa-solid fa-calendar-days text-indigo-500"></i> Календар очікуваних подій
        </h3>
        <div class="flex gap-2">
          <button (click)="prevMonth()" class="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors">
            <i class="fa-solid fa-chevron-left text-xs"></i>
          </button>
          <div class="text-sm font-bold text-slate-700 min-w-[100px] text-center flex items-center justify-center bg-slate-50 rounded-xl px-2">
            {{ currentDate() | date:'LLLL yyyy':'':'uk-UA' }}
          </div>
          <button (click)="nextMonth()" class="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors">
            <i class="fa-solid fa-chevron-right text-xs"></i>
          </button>
        </div>
      </div>

      <!-- Calendar Grid -->
      <div class="mb-8">
        <div class="grid grid-cols-7 gap-1 mb-2">
          <div *ngFor="let day of weekDays" class="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">{{ day }}</div>
        </div>
        <div class="grid grid-cols-7 gap-1 md:gap-2">
          <div *ngFor="let day of calendarDays()" 
               class="min-h-[60px] md:min-h-[80px] p-1 md:p-2 rounded-xl flex flex-col justify-start border border-slate-50/50 transition-colors"
               [ngClass]="{
                 'opacity-40 bg-slate-50/30': !day.isCurrentMonth,
                 'bg-white hover:bg-slate-50 shadow-sm border border-slate-100': day.isCurrentMonth && !day.isToday,
                 'bg-indigo-50 border-indigo-200': day.isToday
               }">
            <span class="text-xs font-bold mb-1" [ngClass]="day.isToday ? 'text-indigo-600' : 'text-slate-600'">
              {{ day.date.getDate() }}
            </span>
            <div class="flex flex-col gap-0.5 mt-auto">
              <span *ngIf="day.totalIncome > 0" class="text-[9px] md:text-[10px] font-black text-emerald-600 truncate bg-emerald-100/50 px-1 rounded">
                +{{ day.totalIncome | number:'1.0-0' }}
              </span>
              <span *ngIf="day.totalExpense > 0" class="text-[9px] md:text-[10px] font-black text-rose-600 truncate bg-rose-100/50 px-1 rounded">
                -{{ day.totalExpense | number:'1.0-0' }}
              </span>
            </div>
          </div>
        </div>
        <div class="flex justify-between items-center mt-3 text-xs font-bold px-2">
           <div class="text-emerald-600">Всього очікується: +{{ totalMonthIncome() | currency:userCurrency:'symbol-narrow':'1.0-0' }}</div>
           <div class="text-rose-600">Всього витрат: -{{ totalMonthExpense() | currency:userCurrency:'symbol-narrow':'1.0-0' }}</div>
        </div>
      </div>

      <!-- Add Event Form -->
      <div class="bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-6">
        <h4 class="text-xs font-black uppercase text-slate-400 tracking-widest mb-4">Додати подію</h4>
        <form (ngSubmit)="addEvent()" class="grid grid-cols-1 md:grid-cols-5 gap-3">
          <input type="text" [(ngModel)]="newEvent.title" name="title" placeholder="Назва події" required
            class="md:col-span-2 px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:border-indigo-500 outline-none">
          
          <input type="number" [(ngModel)]="newEvent.amount" name="amount" placeholder="Сума" required
            class="px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:border-indigo-500 outline-none">
          
          <input type="date" [(ngModel)]="newEvent.date" name="date" required
            class="px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:border-indigo-500 outline-none text-slate-600">
          
          <div class="flex gap-2">
            <button type="button" (click)="newEvent.type = 'expense'"
              class="flex-1 py-3 rounded-xl text-xs font-bold uppercase transition-colors"
              [ngClass]="newEvent.type === 'expense' ? 'bg-rose-500 text-white' : 'bg-white text-slate-400 border border-slate-200'">Витрата</button>
            <button type="button" (click)="newEvent.type = 'income'"
              class="flex-1 py-3 rounded-xl text-xs font-bold uppercase transition-colors"
              [ngClass]="newEvent.type === 'income' ? 'bg-emerald-500 text-white' : 'bg-white text-slate-400 border border-slate-200'">Дохід</button>
          </div>
          
          <div class="md:col-span-5 flex justify-end">
            <button type="submit" [disabled]="!newEvent.title || !newEvent.amount || !newEvent.date"
              class="px-6 py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors">
              Зберегти
            </button>
          </div>
        </form>
      </div>

      <!-- Events List -->
      <div>
        <h4 class="text-xs font-black uppercase text-slate-400 tracking-widest mb-4 px-2">Очікувані події у цьому місяці</h4>
        <div *ngIf="currentMonthEvents().length === 0" class="text-center py-6 text-sm font-bold text-slate-400">
          Немає запланованих подій.
        </div>
        <div class="space-y-2">
          <div *ngFor="let ev of currentMonthEvents()" class="flex justify-between items-center p-4 bg-white border border-slate-100 rounded-2xl hover:border-slate-300 transition-colors">
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                 [ngClass]="ev.type === 'income' ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'">
                <i class="fa-solid" [ngClass]="ev.isSubscription ? 'fa-rotate' : (ev.type === 'income' ? 'fa-arrow-down' : 'fa-arrow-up')"></i>
              </div>
              <div>
                <div class="font-bold text-sm text-slate-800">{{ ev.title }}</div>
                <div class="text-[10px] font-black text-slate-400 uppercase tracking-widest">{{ ev.date | date:'dd MMM yyyy':'':'uk-UA' }}</div>
              </div>
            </div>
            <div class="flex items-center gap-4">
              <div class="font-bold whitespace-nowrap" [ngClass]="ev.type === 'income' ? 'text-emerald-600' : 'text-slate-800'">
                {{ ev.type === 'income' ? '+' : '-' }}{{ ev.amount | currency:userCurrency:'symbol-narrow':'1.0-0' }}
              </div>
              <button *ngIf="!ev.isSubscription" (click)="deleteEvent(ev.id)" class="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors">
                <i class="fa-solid fa-trash-can text-sm block"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  `
})
export class ExpectedCalendarComponent {
  financeData = inject(FinanceDataService);
  datePipe = inject(DatePipe);

  currentDate = signal(new Date());
  weekDays = ['Пн', 'Вв', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];

  newEvent: Partial<ExpectedEvent> = {
    title: '',
    amount: null as any,
    type: 'expense',
    date: new Date().toISOString().split('T')[0]
  };

  get userCurrency() {
    return this.financeData.userSettings().currency;
  }

  // Combine user defined expected events and active subscriptions
  allVirtualEvents = computed(() => {
    const rawEvents = this.financeData.expectedEvents();
    const rate = this.financeData.getExchangeRate('UAH', this.userCurrency);
    
    const events = rawEvents.map(e => {
        const amt = e.currency !== this.userCurrency ? e.amount * this.financeData.getExchangeRate(e.currency, this.userCurrency) : e.amount;
        return {
          id: e.id,
          title: e.title,
          amount: amt,
          type: e.type,
          date: new Date(e.date),
          isSubscription: false
        };
    });

    const subs = this.financeData.subscriptions().map(s => {
      const priceInUserCurrency = s.priceUah * rate;
      return {
        id: s.id,
        title: s.name,
        amount: priceInUserCurrency,
        type: 'expense' as const,
        date: new Date(s.nextPaymentDate),
        isSubscription: true
      };
    });

    return [...events, ...subs].sort((a, b) => a.date.getTime() - b.date.getTime());
  });

  currentMonthEvents = computed(() => {
    const month = this.currentDate().getMonth();
    const year = this.currentDate().getFullYear();
    return this.allVirtualEvents().filter(e => e.date.getMonth() === month && e.date.getFullYear() === year);
  });

  totalMonthIncome = computed(() => this.currentMonthEvents().filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0));
  totalMonthExpense = computed(() => this.currentMonthEvents().filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0));

  calendarDays = computed(() => {
    const year = this.currentDate().getFullYear();
    const month = this.currentDate().getMonth();
    
    const firstDayIndex = new Date(year, month, 1).getDay();
    // adjust to monday start
    const startDay = firstDayIndex === 0 ? 6 : firstDayIndex - 1; 
    
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();
    
    const days: CalendarDay[] = [];
    const today = new Date();
    
    // Add prev month days
    for (let i = startDay - 1; i >= 0; i--) {
      days.push(this.createCalendarDay(new Date(year, month - 1, prevMonthDays - i), false, today));
    }
    
    // Add current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(this.createCalendarDay(new Date(year, month, i), true, today));
    }
    
    // Add next month days to complete grid (42 cells max)
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push(this.createCalendarDay(new Date(year, month + 1, i), false, today));
    }
    
    // Remove last row if totally empty and out of month
    if (days.slice(35).every(d => !d.isCurrentMonth)) {
        return days.slice(0, 35);
    }
    
    return days;
  });

  private createCalendarDay(date: Date, isCurrentMonth: boolean, today: Date): CalendarDay {
    const events = this.allVirtualEvents().filter(e => 
      e.date.getDate() === date.getDate() && 
      e.date.getMonth() === date.getMonth() && 
      e.date.getFullYear() === date.getFullYear()
    );

    const totalIncome = events.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0);
    const totalExpense = events.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0);

    return {
      date,
      isCurrentMonth,
      isToday: date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear(),
      totalIncome,
      totalExpense
    };
  }

  prevMonth() {
    const d = new Date(this.currentDate());
    d.setMonth(d.getMonth() - 1);
    this.currentDate.set(d);
  }

  nextMonth() {
    const d = new Date(this.currentDate());
    d.setMonth(d.getMonth() + 1);
    this.currentDate.set(d);
  }

  addEvent() {
    if (!this.newEvent.title || !this.newEvent.amount || !this.newEvent.date) return;
    
    const event: ExpectedEvent = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      title: this.newEvent.title,
      amount: Number(this.newEvent.amount),
      type: this.newEvent.type as 'income' | 'expense',
      date: this.newEvent.date as string,
      currency: this.userCurrency
    };

    const current = this.financeData.expectedEvents();
    this.financeData.saveExpectedEvents([...current, event]);

    this.newEvent = {
      title: '',
      amount: null as any,
      type: 'expense',
      date: new Date().toISOString().split('T')[0]
    };
    
    // reset current date to the event's date month
    const addedDate = new Date(event.date);
    this.currentDate.set(new Date(addedDate.getFullYear(), addedDate.getMonth(), 1));
  }

  deleteEvent(id: string) {
    const current = this.financeData.expectedEvents().filter(e => e.id !== id);
    this.financeData.saveExpectedEvents(current);
  }
}

import { Component, inject, signal, effect, ViewChild, ElementRef, AfterViewChecked, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FinanceDataService } from '../../../services/finance-data.service';
import { TransactionService } from '../../../services/transaction.service';

interface ChatMessage {
  role: 'user' | 'model' | 'system';
  text: string;
  timestamp: number;
}

@Component({
  selector: 'app-ai-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 bg-white z-[1000] flex flex-col animate-in slide-in-from-bottom duration-300">
      
      <!-- Header -->
      <div class="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0 shadow-lg border-b border-emerald-500/20">
        <div class="flex items-center gap-4">
          <div class="w-10 h-10 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <i class="fa-solid fa-robot text-xl"></i>
          </div>
          <div>
            <h3 class="font-black text-sm md:text-base uppercase tracking-[0.1em]">AI Фінансовий Асистент</h3>
            <div class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Gemini 2.5 Flash • Online</p>
             </div>
          </div>
        </div>
        
        <div class="flex items-center gap-3">
          <button (click)="clearHistory()" title="Очистити історію"
                  class="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 transition-all flex items-center justify-center">
            <i class="fa-solid fa-trash-can text-sm"></i>
          </button>
          <button (click)="handleClose()" 
                  class="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all flex items-center justify-center active:scale-90">
            <i class="fa-solid fa-times text-lg"></i>
          </button>
        </div>
      </div>

      <!-- Messages Area -->
      <div #messagesContainer class="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 bg-[#f8fafc] scroll-smooth pb-10">
        <div *ngFor="let msg of messages()" class="flex" [ngClass]="msg.role === 'user' ? 'justify-end' : 'justify-start'" [hidden]="msg.role === 'system'">
          <div class="max-w-[90%] md:max-w-[70%] flex flex-col gap-1" [ngClass]="msg.role === 'user' ? 'items-end' : 'items-start'">
            
            <div class="px-5 py-4 rounded-3xl text-sm md:text-base shadow-sm leading-relaxed"
                 [ngClass]="msg.role === 'user' ? 
                            'bg-emerald-600 text-white rounded-br-none shadow-emerald-100' : 
                            'bg-white border border-slate-100 text-slate-800 rounded-bl-none'">
              
              <div *ngIf="msg.role === 'model'" class="flex items-center gap-2 mb-2 text-[10px] font-black uppercase text-emerald-500/60">
                 <i class="fa-solid fa-sparkles"></i> AI Assistant
              </div>
              
              <div class="prose prose-slate max-w-none" [innerHTML]="formatMessage(msg.text)"></div>
            </div>
            
            <span class="text-[9px] font-bold text-slate-400 uppercase px-2">
              {{ msg.timestamp | date:'HH:mm' }}
            </span>
          </div>
        </div>
        
        <div *ngIf="isLoading()" class="flex justify-start">
          <div class="bg-white border border-slate-100 shadow-sm rounded-3xl rounded-bl-none px-6 py-4 flex gap-1.5 items-center">
            <div class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce"></div>
            <div class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style="animation-delay: 0.2s"></div>
            <div class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style="animation-delay: 0.4s"></div>
          </div>
        </div>
      </div>

      <!-- Input Area -->
      <div class="p-4 md:p-6 bg-white border-t border-slate-100 shrink-0 shadow-2xl">
        <form (ngSubmit)="sendMessage()" class="max-w-4xl mx-auto flex gap-3">
          <div class="relative flex-1">
            <input type="text" [(ngModel)]="currentInput" name="currentInput"
              placeholder="Спитай щось про твої витрати або плани..."
              class="w-full pl-6 pr-14 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-base font-bold focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-50/50 outline-none transition-all placeholder:text-slate-400"
              [disabled]="isLoading()"
              autocomplete="off">
            <div class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300">
               <i class="fa-solid fa-keyboard text-lg"></i>
            </div>
          </div>
          
          <button type="submit" [disabled]="!currentInput.trim() || isLoading()"
            class="w-14 h-14 bg-emerald-600 text-white rounded-2xl flex flex-shrink-0 items-center justify-center hover:bg-slate-900 disabled:opacity-50 disabled:grayscale transition-all shadow-xl shadow-emerald-100 active:scale-95">
            <i class="fa-solid fa-paper-plane text-xl"></i>
          </button>
        </form>
        <p class="text-center text-[10px] font-bold text-slate-400 uppercase mt-4 tracking-widest opacity-50">
           Ваші фінансові дані не передаються стороннім сервісам, окрім Google Gemini.
        </p>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .prose strong { color: inherit; font-weight: 800; }
    .prose p { margin: 0; }
  `]
})
export class AiChatComponent implements AfterViewChecked, OnInit {
  @Output() close = new EventEmitter<void>();

  financeData = inject(FinanceDataService);
  ts = inject(TransactionService);
  private router = inject(Router);
  private location = inject(Location);

  isLoading = signal(false);
  messages = signal<ChatMessage[]>([]);
  currentInput = '';

  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  handleClose() {
    this.close.emit();
    // If we're on the /ai-chat route, go back
    if (this.router.url.includes('ai-chat')) {
      this.location.back();
    }
  }

  constructor() {
    effect(() => {
      const msgs = this.messages();
      if (msgs.length > 0) {
        localStorage.setItem('eta_ai_chat_history', JSON.stringify(msgs));
      }
    }, { allowSignalWrites: true });
  }

  ngOnInit() {
    const saved = localStorage.getItem('eta_ai_chat_history');
    if (saved) {
      try {
        this.messages.set(JSON.parse(saved));
      } catch (e) {
        this.setInitialGreeting();
      }
    } else {
      this.setInitialGreeting();
    }
    
    // Auto-scroll on init
    setTimeout(() => this.scrollToBottom(), 100);
  }

  private setInitialGreeting() {
    this.messages.set([
      { 
        role: 'model', 
        text: 'Привіт! Я твій особистий фінансовий асистент. Я тут, щоб допомогти тобі розібратися з твоїми витратами, планами та бюджетом. Спитай мене про щось!', 
        timestamp: Date.now() 
      }
    ]);
  }

  clearHistory() {
    if (confirm('Ви впевнені, що хочете очистити всю історію переписки?')) {
      localStorage.removeItem('eta_ai_chat_history');
      this.setInitialGreeting();
    }
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  private scrollToBottom() {
    if (this.messagesContainer) {
      try {
        this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
      } catch (err) {}
    }
  }

  formatMessage(text: string): string {
    // Simple markdown-ish formatting
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  }

  buildSystemContext() {
    const settings = this.financeData.userSettings();
    const plans = this.financeData.expensePlans();
    const accounts = this.financeData.accounts();
    const subs = this.financeData.subscriptions();
    const totalBalance = this.financeData.totalBalance();
    const allTx = this.ts.allTransactions();
    
    // Calculate total subscriptions price
    const subTotalUah = subs.reduce((s, sub) => s + (sub.priceUah || 0), 0);
    const rateToUser = this.financeData.getExchangeRate('UAH', settings.currency);

    // Group by Month for all time history (Summary)
    const monthlyHistory: Record<string, { inc: number, exp: number }> = {};
    const categoryTotals: Record<string, number> = {};

    allTx.forEach(t => {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      if (!monthlyHistory[key]) monthlyHistory[key] = { inc: 0, exp: 0 };
      
      const amtUah = (Number(t.amount) || 0) * this.financeData.getExchangeRate(t.currency || 'UAH', 'UAH');
      if (t.transactionType === 'income') {
        monthlyHistory[key].inc += amtUah;
      } else {
        monthlyHistory[key].exp += amtUah;
        const cat = t.category || 'Інше';
        categoryTotals[cat] = (categoryTotals[cat] || 0) + amtUah;
      }
    });

    const historyShort = Object.entries(monthlyHistory)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([m, val]) => `${m}: +${Math.round(val.inc * rateToUser)} -${Math.round(val.exp * rateToUser)}`)
      .slice(0, 12) 
      .join(', ');

    const topCats = Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([cat, amt]) => `${cat}: ${Math.round(amt * rateToUser)}`)
      .join(', ');

    // Recent transactions (Detailed, max 100)
    const recentTx = allTx.slice(0, 100).map(t => {
        const d = new Date(t.date);
        const day = d.getDate().toString().padStart(2, '0');
        const mo = (d.getMonth() + 1).toString().padStart(2, '0');
        const type = t.transactionType === 'income' ? '+' : '-';
        return `[${day}.${mo}] ${type}${t.amount}${t.currency} ${t.category}${t.description ? ' (' + t.description + ')' : ''}`;
    }).join('\n');

    const context = `Ти — суворий, але надзвичайно розумний та корисний фінансовий консультант.
Користувач: ${settings.name || 'Анонім'}. Валюта: ${settings.currency}.
Сьогодні: ${new Date().toISOString().split('T')[0]}.

ФІНАНСОВИЙ СТАТУС:
- Баланс: ${totalBalance} ${settings.currency}
- Рахунки: ${accounts.map((a: any) => `${a.name}: ${a.balance}${a.currency}`).join(', ')}
- Підписки: ${subs.length} на ${Math.round(subTotalUah * rateToUser)} ${settings.currency}/міс
- Плани: ${JSON.stringify(plans.map(p => ({ cat: p.category, amt: p.amount })))}

ІСТОРІЯ ПО МІСЯЦЯХ (останні 12): ${historyShort}
ТОП КАТЕГОРІЙ ВИТРАТ (за весь час): ${topCats}

ОСТАННІ ТРАНЗАКЦІЇ (детально, до 100 шт):
${recentTx}

ІНСТРУКЦІЇ:
1. Аналізуй тренди за всі місяці (збільшення/зменшення витрат).
2. Давай поради щодо економії на основі ТОП категорій.
3. Форматуй Markdown. Будь лаконічним. Мова: Українська.
4. Не вигадуй дані. Якщо чогось немає — скажи про це.
5. Якщо повідомлення користувача містить дані про нову витрату або дохід (наприклад, копія SMS від банку або просто "витратив 100 на каву"), ти МАЄШ розпізнати: суму (amount), валюту (currency, default UAH), категорію (category), опис (description) та тип (transactionType: 'expense' або 'income'). ПІСЛЯ своєї текстової відповіді ОБОВ'ЯЗКОВО додай JSON-блок наступного формату (без пояснень, просто блок):
\`\`\`json
{ "type": "transaction", "data": { "amount": 100, "currency": "UAH", "category": "Їжа", "description": "Опис", "transactionType": "expense" } }
\`\`\`
Це КРИТИЧНО важливо для автоматизації. Дату використовуй поточну.`;

    const currentMsg = [...this.messages()];
    const sysIndex = currentMsg.findIndex(m => m.role === 'system');
    if (sysIndex >= 0) {
      currentMsg[sysIndex].text = context;
    } else {
      currentMsg.unshift({ role: 'system', text: context, timestamp: Date.now() });
    }
    this.messages.set(currentMsg);
  }

  async sendMessage() {
    if (!this.currentInput.trim()) return;

    const userText = this.currentInput;
    this.currentInput = '';
    
    this.messages.set([...this.messages(), { role: 'user', text: userText, timestamp: Date.now() }]);
    this.isLoading.set(true);

    this.buildSystemContext();

    const apiKey = this.financeData.userSettings().geminiApiKey;
    if (!apiKey) {
      this.messages.set([...this.messages(), { role: 'model', text: 'Помилка: API ключ не знайдено. Перейдіть в налаштування, щоб додати його.', timestamp: Date.now() }]);
      this.isLoading.set(false);
      return;
    }

    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const history = this.messages().map(m => ({
      role: m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.text }]
    }));

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: history, generationConfig: { temperature: 0.3, maxOutputTokens: 500 } })
      });
      
      const res = await response.json();
      if (res.error) throw res.error;

      const reply = res.candidates?.[0]?.content?.parts?.[0]?.text;
      if (reply) {
        this.messages.set([...this.messages(), { role: 'model', text: reply, timestamp: Date.now() }]);
        
        // Check for transaction JSON in the reply
        this.checkForTransaction(reply);
      } else {
        this.messages.set([...this.messages(), { role: 'model', text: 'Вибачте, виникла помилка. Спробуйте ще раз.', timestamp: Date.now() }]);
      }
    } catch (err: any) {
      this.messages.set([...this.messages(), { role: 'model', text: `Помилка: ${err.message || 'Перевірте свій API ключ'}`, timestamp: Date.now() }]);
    } finally {
      this.isLoading.set(false);
      this.scrollToBottom();
    }
  }

  private checkForTransaction(text: string) {
    try {
      const match = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*?"type":\s*"transaction"[\s\S]*?\}/);
      if (match) {
        const jsonStr = match[1] || match[0];
        const obj = JSON.parse(jsonStr);
        if (obj.type === 'transaction' && obj.data) {
          const tx = obj.data;
          this.ts.addTransaction({
            ...tx,
            date: new Date().toISOString()
          });
          this.financeData.toasts.show(`Транзакцію додано: ${tx.amount}${tx.currency} (${tx.category})`, 'success');
        }
      }
    } catch (e) {
      console.error('Failed to parse transaction from AI response', e);
    }
  }
}

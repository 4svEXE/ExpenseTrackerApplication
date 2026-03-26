import { Component, inject, signal, effect, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceDataService } from '../../../services/finance-data.service';
import { TransactionService } from '../../../services/transaction.service';

interface ChatMessage {
  role: 'user' | 'model' | 'system';
  text: string;
}

@Component({
  selector: 'app-ai-consultant',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Floating Button -->
    <button *ngIf="!isOpen()" (click)="toggleChat()"
      class="fixed bottom-24 right-4 md:bottom-8 md:right-8 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-[0_8px_30px_rgba(79,70,229,0.4)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40 group">
      <i class="fa-solid fa-robot text-xl group-hover:animate-bounce"></i>
    </button>

    <!-- Chat Window -->
    <div *ngIf="isOpen()" 
      class="fixed inset-0 md:inset-auto md:bottom-28 md:right-8 md:w-[400px] md:h-[600px] md:rounded-[2rem] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.1)] z-50 flex flex-col overflow-hidden animate-in slide-in-from-bottom-full md:slide-in-from-bottom-8 duration-300">
      
      <!-- Header -->
      <div class="px-6 py-4 bg-indigo-600 text-white flex items-center justify-between shrink-0">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shadow-inner">
            <i class="fa-solid fa-robot text-lg"></i>
          </div>
          <div>
            <h3 class="font-extrabold text-sm uppercase tracking-wider">AI Консультант</h3>
            <p class="text-[10px] text-indigo-200 font-bold">GEMINI 2.5 FLASH</p>
          </div>
        </div>
        <button (click)="toggleChat()" class="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors">
          <i class="fa-solid fa-xmark text-sm block"></i>
        </button>
      </div>

      <!-- Api key warning -->
      <div *ngIf="!hasApiKey" class="flex-1 p-6 flex flex-col items-center justify-center text-center bg-slate-50">
        <div class="w-16 h-16 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center mb-4 text-2xl">
          <i class="fa-solid fa-key block"></i>
        </div>
        <h4 class="font-bold text-slate-800 mb-2">Ключ API не знайдено</h4>
        <p class="text-xs text-slate-500 mb-6 px-4">Щоб користуватись ШІ-асистентом, будь ласка, додайте ваш Gemini 2.5 API ключ у вкладці "Дані" в налаштуваннях.</p>
        <button (click)="toggleChat()" class="px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-black transition-colors block">Зрозуміло</button>
      </div>

      <!-- Messages -->
      <div *ngIf="hasApiKey" #messagesContainer class="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 scroll-smooth">
        <div *ngFor="let msg of messages()" class="flex" [ngClass]="msg.role === 'user' ? 'justify-end' : 'justify-start'" [hidden]="msg.role === 'system'">
          <div class="max-w-[85%] rounded-2xl p-4 text-sm"
            [ngClass]="msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-white border border-slate-100 shadow-sm text-slate-800 rounded-bl-sm'">
            
            <div *ngIf="msg.role === 'model'" class="flex items-center gap-2 mb-2 text-[10px] font-black uppercase text-indigo-400">
              <i class="fa-solid fa-robot block"></i> AI Assistant
            </div>
            
            <p class="whitespace-pre-wrap leading-relaxed marker:text-indigo-400" [innerHTML]="formatMessage(msg.text)"></p>
          </div>
        </div>
        
        <div *ngIf="isLoading()" class="flex justify-start">
          <div class="bg-white border border-slate-100 shadow-sm rounded-2xl rounded-bl-sm p-4 flex gap-1 items-center">
            <div class="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"></div>
            <div class="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style="animation-delay: 0.2s"></div>
            <div class="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style="animation-delay: 0.4s"></div>
          </div>
        </div>
      </div>

      <!-- Input -->
      <div *ngIf="hasApiKey" class="px-4 py-3 bg-white border-t border-slate-100 shrink-0">
        <form (ngSubmit)="sendMessage()" class="flex gap-2">
          <input type="text" [(ngModel)]="currentInput" name="currentInput"
            placeholder="Спитай щось про фінанси..."
            class="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
            [disabled]="isLoading()"
            autocomplete="off">
          <button type="submit" [disabled]="!currentInput.trim() || isLoading()"
            class="w-[46px] h-[46px] bg-indigo-600 text-white rounded-xl flex flex-shrink-0 items-center justify-center hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
            <i class="fa-solid fa-paper-plane text-sm block"></i>
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class AiConsultantComponent implements AfterViewChecked {
  financeData = inject(FinanceDataService);
  ts = inject(TransactionService);

  isOpen = signal(false);
  isLoading = signal(false);
  messages = signal<ChatMessage[]>([{ role: 'model', text: 'Привіт! Я твій особистий фінансовий AI консультант. Я бачу всі твої транзакції та бюджети. Чим можу допомогти?' }]);
  currentInput = '';

  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  get hasApiKey(): boolean {
    return !!this.financeData.userSettings().geminiApiKey;
  }

  toggleChat() {
    this.isOpen.set(!this.isOpen());
    if (this.isOpen() && this.messages().length === 1 && this.hasApiKey) {
      this.buildSystemContext();
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
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  }

  buildSystemContext() {
    const settings = this.financeData.userSettings();
    const accounts = this.financeData.accounts();
    const subs = this.financeData.subscriptions();
    
    // Convert dates implicitly without type errors
    const recentTx = this.ts.allTransactions().slice(0, 50).map(t => {
        let d: any = t.date;
        if (typeof d === 'string') d = new Date(d);
        if (d && d.toISOString) d = d.toISOString();
        return `[${(d as string).split('T')[0]}] ${(t.transactionType || 'EXPENSE').toUpperCase()} ${t.amount} ${t.currency} - ${t.category} (${t.description || ''})`;
    }).join('\n');

    let context = `You are a strict, smart, and helpful financial consultant for the user ${settings.name || 'User'}. You must reply in Ukrainian.
Here is the user's financial profile:
Total Balance: ${this.financeData.totalBalance()} ${settings.currency}
Accounts: ${JSON.stringify(accounts.map((a: any) => ({ name: a.name, bal: a.balance, cur: a.currency })))}
Subscriptions: ${JSON.stringify(subs.map((s: any) => ({ name: s.name, price: s.price, cur: s.currency })))}
Recent 50 Transactions:
${recentTx}

Provide precise, actionable financial advice based ONLY on this context. Answer briefly and clearly in Markdown. DO NOT hallucinate transactions.`;

    const currentMsg = [...this.messages()];
    const sysIndex = currentMsg.findIndex(m => m.role === 'system');
    if (sysIndex >= 0) {
      currentMsg[sysIndex].text = context;
    } else {
      currentMsg.unshift({ role: 'system', text: context });
    }
    this.messages.set(currentMsg);
  }

  async sendMessage() {
    if (!this.currentInput.trim()) return;

    const userText = this.currentInput;
    this.currentInput = '';
    
    const newMsg: ChatMessage = { role: 'user', text: userText };
    this.messages.set([...this.messages(), newMsg]);
    this.isLoading.set(true);

    this.buildSystemContext();

    const apiKey = this.financeData.userSettings().geminiApiKey;
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const contents = this.messages().map(m => {
      let role = m.role === 'model' ? 'model' : 'user';
      return {
        role: role,
        parts: [{ text: m.text }]
      };
    });

    const payload = {
      contents: contents,
      generationConfig: {
        temperature: 0.4
      }
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      const res = await response.json();
      
      if (res.error) throw res.error;

      const reply = res.candidates?.[0]?.content?.parts?.[0]?.text;
      if (reply) {
        this.messages.set([...this.messages(), { role: 'model', text: reply }]);
      } else {
        this.messages.set([...this.messages(), { role: 'model', text: 'Вибачте, виникла помилка у формуванні відповіді.' }]);
      }
    } catch (err: any) {
      console.error('Gemini error:', err);
      const errMsg = err.message || 'Помилка мережі або невірний API ключ.';
      this.messages.set([...this.messages(), { role: 'model', text: `Помилка: ${errMsg}` }]);
    } finally {
      this.isLoading.set(false);
    }
  }
}

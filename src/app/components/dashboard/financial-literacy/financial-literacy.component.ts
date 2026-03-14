import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

interface FinancialCard {
  id: number;
  topic: string;
  front: string;     // питання / поняття
  back: string;      // пояснення / відповідь
  emoji: string;
  color: string;     // tailwind gradient classes
}

const FINANCIAL_CARDS: FinancialCard[] = [
  {
    id: 1,
    topic: 'Бюджетування',
    front: 'Правило 50/30/20',
    back: '50% доходу — на необхідне (житло, їжа), 30% — на бажане (розваги, хобі), 20% — на заощадження та виплату боргів.',
    emoji: '🧮',
    color: 'from-blue-500 to-indigo-600'
  },
  {
    id: 2,
    topic: 'Інвестування',
    front: 'Складний відсоток',
    back: 'Відсотки нараховуються не лише на початкову суму, а й на вже накопичені відсотки. Це "магія" довгострокового інвестування — гроші ростуть в геометричній прогресії.',
    emoji: '📈',
    color: 'from-emerald-500 to-teal-600'
  },
  {
    id: 3,
    topic: 'Фонд надзвичайних ситуацій',
    front: 'Що таке "подушка безпеки"?',
    back: 'Резервний фонд у розмірі 3-6 місячних витрат, зберігається на ліквідному рахунку. Захищає від непередбачених витрат (ремонт, хвороба, втрата роботи) без залізання у борги.',
    emoji: '🛡️',
    color: 'from-amber-500 to-orange-600'
  },
  {
    id: 4,
    topic: 'Інвестування',
    front: 'Диверсифікація портфеля',
    back: 'Розподіл інвестицій між різними активами (акції, облігації, нерухомість, крипто). Мінімізує ризик — якщо один актив падає, інші можуть зростати.',
    emoji: '🌐',
    color: 'from-violet-500 to-purple-600'
  },
  {
    id: 5,
    topic: 'Борги',
    front: 'Метод "Снігової кулі"',
    back: 'Погашай борги від найменшого до найбільшого, незалежно від відсоткової ставки. Психологічний ефект: швидкі перемоги над маленькими боргами мотивують.',
    emoji: '❄️',
    color: 'from-cyan-500 to-sky-600'
  },
  {
    id: 6,
    topic: 'Борги',
    front: 'Метод "Лавина"',
    back: 'Погашай борги від найвищої ставки до найнижчої. Математично оптимальніший за "снігову кулю" — заощаджуєш більше на відсотках.',
    emoji: '🏔️',
    color: 'from-slate-600 to-gray-800'
  },
  {
    id: 7,
    topic: 'Заощадження',
    front: 'Pay Yourself First',
    back: 'Принцип "Спочатку заплати собі": відразу після отримання зарплати відкладай певний % в заощадження, а вже решту витрачай. Автоматизуй це через автоплатіж.',
    emoji: '💰',
    color: 'from-rose-500 to-pink-600'
  },
  {
    id: 8,
    topic: 'Психологія грошей',
    front: 'Гедонічна адаптація',
    back: 'Люди швидко звикають до нových речей і повертаються до базового рівня щастя. Купівля дорогих речей дає короткочасне задоволення — інвестуй у досвід та пасивний дохід.',
    emoji: '🧠',
    color: 'from-fuchsia-500 to-purple-600'
  },
  {
    id: 9,
    topic: 'Податки',
    front: 'Податкова оптимізація',
    back: 'Легальне зменшення податкового навантаження: використання необкладаємих рахунків, відрахувань, пільг. В Україні: ФОП 3-ї групи — 5% або 3% + ПДВ від обороту.',
    emoji: '📋',
    color: 'from-lime-600 to-green-700'
  },
  {
    id: 10,
    topic: 'Інфляція',
    front: 'Реальна vs Номінальна дохідність',
    back: 'Реальна дохідність = Номінальна - Інфляція. Якщо банк платить 10%, але інфляція 15% — ти втрачаєш 5% купівельної спроможності щороку.',
    emoji: '💸',
    color: 'from-orange-600 to-red-600'
  },
  {
    id: 11,
    topic: 'Страхування',
    front: 'Навіщо потрібне страхування?',
    back: 'Страхування — це передача ризику за невелику щорічну плату. Захищає від катастрофічних втрат (хвороба, ДТП, пожежа). Страхуй те, що неможливо дозволити собі відновити самому.',
    emoji: '☂️',
    color: 'from-teal-600 to-cyan-700'
  },
  {
    id: 12,
    topic: 'Нерухомість',
    front: 'Оренда vs Купівля',
    back: 'Купівля = актив (якщо без кредиту або рентабельний). Оренда = гнучкість + відсутність ризику знецінення та ремонту. Правило: купуй, якщо ціна/оренда P/R < 20 (окупається за 20 років).',
    emoji: '🏠',
    color: 'from-blue-600 to-indigo-700'
  },
  {
    id: 13,
    topic: 'Пасивний дохід',
    front: 'Джерела пасивного доходу',
    back: 'Дивіденди від акцій, відсотки від облігацій, оренда нерухомості, роялті (книги, музика), партнерські програми, бізнес що працює без тебе. Мета — покрити базові витрати пасивним доходом.',
    emoji: '🌴',
    color: 'from-emerald-600 to-green-700'
  },
  {
    id: 14,
    topic: 'Кредити',
    front: 'APR vs Відсоткова ставка',
    back: 'Відсоткова ставка — тільки відсотки. APR (Annual Percentage Rate) — включає всі додаткові збори, страховки та комісії. Завжди порівнюй APR, а не просто ставку!',
    emoji: '🏦',
    color: 'from-red-600 to-rose-700'
  },
  {
    id: 15,
    topic: 'Психологія',
    front: 'Упередження до теперішнього',
    back: 'Людський мозок надмірно цінує теперішнє задоволення і недооцінює майбутнє. Це призводить до відкладання заощаджень. Рішення: автоматизуй ощадні платежі.',
    emoji: '⏰',
    color: 'from-amber-600 to-yellow-700'
  }
];

@Component({
  selector: 'app-financial-literacy',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-gradient-to-br from-slate-900 to-black rounded-3xl p-6 md:p-8 text-white relative overflow-hidden">
      <!-- Background decoration -->
      <div class="absolute -right-20 -top-20 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute -left-20 -bottom-20 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <!-- Header -->
      <div class="flex items-center justify-between mb-6 relative z-10">
        <div>
          <h3 class="text-xl font-bold flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
              🎓
            </div>
            Фінансова Грамотність
          </h3>
          <p class="text-white/40 text-xs mt-1">{{ currentIndex() + 1 }} / {{ cards.length }} карток • натисни, щоб перевернути</p>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-[10px] font-bold px-2 py-1 rounded-lg bg-white/10 text-white/60">{{ getCurrentCard().topic }}</span>
        </div>
      </div>

      <!-- Flashcard -->
      <div class="card-container relative z-10 mb-6 cursor-pointer" (click)="flip()" style="perspective: 1000px; height: 180px;">
        <div class="card-inner w-full h-full relative transition-transform duration-500"
             [style.transform]="isFlipped() ? 'rotateY(180deg)' : 'rotateY(0deg)'"
             style="transform-style: preserve-3d;">
          
          <!-- Front -->
          <div class="card-face front absolute inset-0 rounded-2xl bg-gradient-to-br flex flex-col items-center justify-center p-6 text-center"
               [ngClass]="'bg-gradient-to-br ' + getCurrentCard().color"
               style="backface-visibility: hidden;">
            <div class="text-4xl mb-4">{{ getCurrentCard().emoji }}</div>
            <h4 class="text-xl font-black text-white leading-tight">{{ getCurrentCard().front }}</h4>
            <p class="text-white/60 text-xs mt-2">Натисни, щоб дізнатись →</p>
          </div>

          <!-- Back -->
          <div class="card-face back absolute inset-0 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex flex-col justify-center p-6"
               style="backface-visibility: hidden; transform: rotateY(180deg);">
            <p class="text-white text-sm leading-relaxed font-medium">{{ getCurrentCard().back }}</p>
            <p class="text-white/40 text-xs mt-3">{{ getCurrentCard().topic }}</p>
          </div>
        </div>
      </div>

      <!-- Navigation & Progress -->
      <div class="flex items-center gap-4 relative z-10">
        <button (click)="prev()" [disabled]="currentIndex() === 0"
          class="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white/80 hover:bg-white/20 transition-all disabled:opacity-30 active:scale-95">
          <i class="fa-solid fa-chevron-left text-sm"></i>
        </button>

        <!-- Progress dots -->
        <div class="flex-1 flex items-center justify-center gap-1.5 overflow-hidden">
          @for (card of visibleDots(); track card.id) {
            <button (click)="goTo(card.visibleIndex)"
              class="rounded-full transition-all duration-200"
              [ngClass]="card.isActive ? 'w-5 h-2 bg-white' : 'w-2 h-2 bg-white/30 hover:bg-white/50'">
            </button>
          }
        </div>

        <button (click)="next()" [disabled]="currentIndex() === cards.length - 1"
          class="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white/80 hover:bg-white/20 transition-all disabled:opacity-30 active:scale-95">
          <i class="fa-solid fa-chevron-right text-sm"></i>
        </button>

        <button (click)="shuffle()"
          class="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white/60 hover:bg-white/20 transition-all active:scale-95 active:rotate-180"
          title="Перемішати">
          <i class="fa-solid fa-shuffle text-sm"></i>
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .card-inner { transition: transform 0.5s ease; }
    .card-face { backface-visibility: hidden; }
  `]
})
export class FinancialLiteracyComponent {
  cards = [...FINANCIAL_CARDS];
  currentIndex = signal(0);
  isFlipped = signal(false);

  getCurrentCard(): FinancialCard {
    return this.cards[this.currentIndex()];
  }

  visibleDots = computed(() => {
    const total = this.cards.length;
    const current = this.currentIndex();
    const maxDots = 7;
    
    let start = Math.max(0, current - Math.floor(maxDots / 2));
    let end = Math.min(total, start + maxDots);
    if (end - start < maxDots) start = Math.max(0, end - maxDots);

    return Array.from({ length: end - start }, (_, i) => ({
      id: start + i,
      visibleIndex: start + i,
      isActive: start + i === current
    }));
  });

  flip() {
    this.isFlipped.set(!this.isFlipped());
  }

  prev() {
    if (this.currentIndex() > 0) {
      this.currentIndex.set(this.currentIndex() - 1);
      this.isFlipped.set(false);
    }
  }

  next() {
    if (this.currentIndex() < this.cards.length - 1) {
      this.currentIndex.set(this.currentIndex() + 1);
      this.isFlipped.set(false);
    }
  }

  goTo(index: number) {
    this.currentIndex.set(index);
    this.isFlipped.set(false);
  }

  shuffle() {
    const shuffled = [...this.cards].sort(() => Math.random() - 0.5);
    this.cards = shuffled;
    this.currentIndex.set(0);
    this.isFlipped.set(false);
  }
}

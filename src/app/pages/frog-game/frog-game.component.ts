import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FrogGameService, FrogMood, POND_SHOP_ITEMS, PondUpgrade, getXpForLevel } from '../../services/frog-game.service';
import { FinanceDataService } from '../../services/finance-data.service';
import { FrogCharacterComponent } from '../../components/frog/frog-character/frog-character.component';

type ShopTab = 'pond' | 'frog' | 'atmosphere';
type PageTab = 'home' | 'shop' | 'friends';

const NPC_FRIENDS = [
  { id: 'vasyl', name: 'Жаб Василь', level: 42, phase: 'adult-frog' as const, color: '#86efac', traits: ['🎵 Меломан', '💤 Лінива'], upgrades: ['lily_1', 'rocks', 'lily_3'] },
  { id: 'oksana', name: 'Кваква Оксана', level: 67, phase: 'wise-frog' as const, color: '#67e8f9', traits: ['🧪 Вчена', '🌹 Романтик'], upgrades: ['waterfall', 'fish', 'lily_gold', 'npc_frog'] },
  { id: 'petro', name: 'Жабо Петро', level: 15, phase: 'young-frog' as const, color: '#bbf7d0', traits: ['🤩 Гіперактивна'], upgrades: [] },
  { id: 'hlib', name: 'Мудрий Гліб', level: 91, phase: 'sensei-frog' as const, color: '#c4b5fd', traits: ['📖 Філософ', '🧘 Медит', '🔮 Провидець'], upgrades: ['stars', 'fog', 'npc_wise', 'lily_gold'] },
  { id: 'sonia', name: 'Жаба Соня', level: 31, phase: 'young-frog' as const, color: '#fde68a', traits: ['🦉 Сова', '😂 Гуморист'], upgrades: ['lanterns', 'reeds'] },
  { id: 'oleg', name: 'Зелений Олег', level: 58, phase: 'adult-frog' as const, color: '#4ade80', traits: ['💪 Спортсмен', '🏆 Чемпіон'], upgrades: ['bridge', 'fish', 'npc_frog'] },
  { id: 'lesia', name: 'Принцеса Леся', level: 76, phase: 'master-frog' as const, color: '#fca5a5', traits: ['👑 Аристократ', '🎭 Актор'], upgrades: ['lily_gold', 'hat_crown', 'lanterns', 'waterfall'] },
  { id: 'zhak', name: 'Старий Жак', level: 99, phase: 'sensei-frog' as const, color: '#a5b4fc', traits: ['🔮 Провидець', 'Сенсей ☁️'], upgrades: ['fog', 'stars', 'npc_wise', 'seasons', 'lily_gold', 'waterfall'] },
];

@Component({
  selector: 'app-frog-game',
  standalone: true,
  imports: [CommonModule, FormsModule, FrogCharacterComponent],
  template: `
    <div class="min-h-screen bg-gradient-to-b from-emerald-950 via-slate-900 to-indigo-950 font-sans pb-24 relative overflow-hidden">
      
      <!-- Animated background stars -->
      <div class="absolute inset-0 pointer-events-none overflow-hidden">
        <div *ngFor="let s of stars" class="absolute rounded-full bg-white opacity-40 animate-pulse"
             [style.width.px]="s.size" [style.height.px]="s.size"
             [style.left.%]="s.x" [style.top.%]="s.y"
             [style.animation-delay]="s.delay + 's'"></div>
      </div>

      <!-- Header -->
      <div class="relative z-10 px-4 pt-14 md:pt-20 pb-4 flex items-center gap-4">
        <button (click)="goBack()" class="w-10 h-10 rounded-2xl bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all">
          <i class="fa-solid fa-arrow-left"></i>
        </button>
        <div class="flex-1">
          <h1 class="text-white font-black text-xl tracking-tight">🐸 Мій Ставок</h1>
          <p class="text-emerald-300 text-xs font-bold uppercase tracking-widest">{{ frogGame.getPhaseName() }}</p>
        </div>
        <!-- Coins -->
        <div class="flex items-center gap-2 bg-amber-400/20 px-4 py-2 rounded-2xl border border-amber-400/30">
          <span class="text-amber-300 font-black text-sm">🪙 {{ frogGame.getCoins() }}</span>
        </div>
      </div>

      <!-- Tabs -->
      <div class="relative z-10 px-4 mb-4 flex gap-2">
        <button *ngFor="let tab of tabs" (click)="activeTab = tab.id"
                class="flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                [ngClass]="activeTab === tab.id ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-white/10 text-slate-300 hover:bg-white/15'">
          {{ tab.label }}
        </button>
      </div>

      <!-- ========== HOME TAB ========== -->
      <div *ngIf="activeTab === 'home'" class="relative z-10 px-4 space-y-4">
        
        <!-- Pond Stage (Main visual) -->
        <div class="relative rounded-3xl overflow-hidden min-h-[340px] md:min-h-[420px]"
             [style]="pondBackground">
          
          <!-- Pond water -->
          <div class="absolute bottom-0 left-0 right-0 h-[55%] rounded-t-[50%]"
               style="background: linear-gradient(180deg, rgba(16,185,129,0.25) 0%, rgba(5,150,105,0.5) 100%); backdrop-filter: blur(2px);">
          </div>
          
          <!-- Waterfall effect if purchased -->
          <div *ngIf="frogGame.hasUpgrade('waterfall')"
               class="absolute top-0 right-12 w-4 bottom-[44%]"
               style="background: linear-gradient(180deg, rgba(147,197,253,0.6) 0%, rgba(186,230,253,0.3) 100%); border-radius: 0 0 8px 8px;"></div>

          <!-- Tree -->
          <div *ngIf="frogGame.hasUpgrade('tree')" class="absolute left-4 bottom-[44%]">
            <div class="text-5xl">🌳</div>
          </div>

          <!-- Money Tree -->
          <div *ngIf="frogGame.hasUpgrade('tree_money')" 
               class="absolute left-[30%] bottom-[46%] flex flex-col items-center cursor-pointer group transition-all"
               (click)="frogGame.collectMoneyTree()">
            <div class="text-5xl group-hover:scale-110 transition-transform relative drop-shadow-xl">
              💰
              <div *ngIf="frogGame.canCollectMoneyTree()" 
                   class="absolute -top-2 -right-2 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center animate-bounce shadow-lg shadow-amber-500/50 border-2 border-slate-900">
                <span class="text-[10px] text-slate-900 font-extrabold">!</span>
              </div>
            </div>
            <div *ngIf="!frogGame.canCollectMoneyTree()" 
                 class="bg-black/50 backdrop-blur-sm rounded-full px-2 py-0.5 mt-1 border border-white/10">
              <span class="text-[8px] text-white font-extrabold tracking-tighter">{{ frogGame.timeUntilCollect() }}</span>
            </div>
          </div>

          <!-- Lanterns -->
          <div *ngIf="frogGame.hasUpgrade('lanterns')" class="absolute top-4 right-4 flex gap-3">
            <span class="text-2xl">🏮</span>
            <span class="text-2xl" style="animation-delay:0.5s">🏮</span>
          </div>

          <!-- Stars background -->
          <div *ngIf="frogGame.hasUpgrade('stars') && isNight" class="absolute inset-0 flex flex-wrap gap-4 p-4 opacity-60">
            <span *ngFor="let i of [1,2,3,4,5,6,7,8]" class="text-lg">⭐</span>
          </div>

          <!-- Fireflies at night -->
          <div *ngIf="frogGame.hasUpgrade('fireflies') && isNight" class="absolute inset-0 pointer-events-none">
            <div *ngFor="let f of fireflies" class="absolute w-2 h-2 rounded-full bg-yellow-300 animate-ping opacity-70"
                 [style.left.%]="f.x" [style.top.%]="f.y" [style.animation-delay]="f.delay + 's'"></div>
          </div>

          <!-- Lily pads -->
          <div *ngIf="frogGame.hasUpgrade('lily_1')" class="absolute bottom-[50%] left-[20%]">
            <span class="text-4xl">🍀</span>
          </div>
          <div *ngIf="frogGame.hasUpgrade('lily_3')" class="absolute bottom-[47%] right-[22%]">
            <span class="text-3xl">🌸</span>
          </div>
          <div *ngIf="frogGame.hasUpgrade('lily_gold')" class="absolute bottom-[46%] left-[45%]">
            <span class="text-4xl animate-pulse">🌟</span>
          </div>
          
          <!-- Rocks -->
          <div *ngIf="frogGame.hasUpgrade('rocks')" class="absolute bottom-[44%] right-4 flex gap-1">
            <span class="text-xl">🪨</span><span class="text-lg">🪨</span>
          </div>

          <!-- Reeds -->
          <div *ngIf="frogGame.hasUpgrade('reeds')" class="absolute bottom-[44%] left-4 flex gap-1">
            <span class="text-2xl">🌾</span><span class="text-2xl" style="transform:scaleX(-1)">🌾</span>
          </div>

          <!-- Bridge -->
          <div *ngIf="frogGame.hasUpgrade('bridge')" class="absolute bottom-[44%] right-[30%]">
            <div class="text-3xl">🌉</div>
          </div>

          <!-- NPC frogs -->
          <div *ngIf="frogGame.hasUpgrade('npc_frog')" class="absolute bottom-[45%] right-[10%]">
            <span class="text-3xl">🐸</span>
          </div>
          <div *ngIf="frogGame.hasUpgrade('npc_wise')" class="absolute bottom-[55%] left-[50%] text-center">
            <div class="text-2xl">🧙</div>
            <div class="text-[8px] text-white font-bold bg-black/40 rounded px-1 mt-0.5">Мудрий Дід</div>
          </div>

          <!-- Fish underwater -->
          <div *ngIf="frogGame.hasUpgrade('fish')" class="absolute bottom-[15%] w-full flex justify-around opacity-60">
            <span class="text-xl animate-pulse">🐟</span>
            <span class="text-lg animate-pulse" style="animation-delay:1s">🐠</span>
          </div>

          <!-- MAIN FROG (center stage) -->
          <div class="absolute inset-0 flex flex-col items-center justify-center z-10" style="padding-bottom: 5%">
            
            <!-- Speech bubble above frog -->
            <div class="mb-4 bg-white text-slate-800 rounded-3xl p-3 px-5 border border-slate-200 shadow-xl relative animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-[80%] text-center">
              <div class="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45 border-r border-b border-slate-200"></div>
              <p class="font-bold text-sm leading-relaxed">{{ frogGame.currentPhrase() }}</p>
            </div>

            <div class="flex flex-col items-center gap-2 cursor-pointer drop-shadow-2xl" (click)="onFrogClick()">
              <app-frog-character
                [phase]="frog.phase"
                [accessories]="frog.accessories.concat(frog.pondUpgrades)"
                [color]="frogColor"
                [isAnimating]="frogGame.isAnimating()"
                [isSleepy]="isSleepyTime"
                [size]="140">
              </app-frog-character>
            </div>
          </div>

          <!-- Mood indicator -->
          <div class="absolute top-4 left-4 bg-black/30 backdrop-blur-sm rounded-2xl px-3 py-2 z-20">
            <span class="text-xs font-black text-white">{{ moodEmoji }} {{ moodLabel }}</span>
          </div>

          <!-- Morning fog overlay -->
          <div *ngIf="frogGame.hasUpgrade('fog') && isMorning"
               class="absolute inset-0 bg-slate-200/20 backdrop-blur-[1px] pointer-events-none rounded-3xl z-20"></div>
        </div>

        <!-- Name + Level -->
        <div class="bg-white/10 backdrop-blur-sm rounded-3xl p-5 border border-white/20">
          <div class="flex items-center justify-between mb-3">
            <div>
              <div *ngIf="!editingName" class="flex items-center gap-2">
                <span class="text-white font-black text-xl">{{ frog.name }}</span>
                <button (click)="editingName = true" class="text-slate-400 hover:text-white transition-colors">
                  <i class="fa-solid fa-pen text-xs"></i>
                </button>
              </div>
              <input *ngIf="editingName" [(ngModel)]="newName" (keydown.enter)="saveName()" (blur)="saveName()"
                     class="bg-white/20 text-white font-black text-xl px-3 py-1 rounded-xl outline-none border border-white/30 w-40"
                     [placeholder]="frog.name">
              <p class="text-emerald-300 text-xs font-bold mt-0.5">{{ frogGame.getPhaseName() }}</p>
            </div>
            <div class="text-right">
              <span class="text-amber-300 font-black text-2xl">{{ frog.level }}</span>
              <span class="text-slate-400 text-xs font-bold">&nbsp;/ 99</span>
            </div>
          </div>
          <!-- XP Bar -->
          <div class="h-3 bg-white/10 rounded-full overflow-hidden border border-white/10">
            <div class="h-full bg-gradient-to-r from-emerald-400 to-emerald-300 transition-all duration-700 rounded-full"
                 [style.width.%]="frogGame.getXpProgress()"></div>
          </div>
          <p class="text-slate-400 text-xs font-bold mt-2">XP: {{ frog.xp }} / {{ xpNeeded }}</p>

          <!-- Traits -->
          <div *ngIf="frog.traits.length > 0" class="mt-4 flex flex-wrap gap-2">
            <span *ngFor="let trait of frog.traits" 
                  class="px-3 py-1 bg-white/10 rounded-full text-xs font-bold text-emerald-200 border border-white/10">
              {{ frogGame.getTraitName(trait) }}
            </span>
          </div>
        </div>

    <!-- Actions row -->
    <div class="grid grid-cols-2 gap-3">
      <!-- Feed button -->
      <button (click)="feed()" 
              [disabled]="!frogGame.canFeed()"
              class="py-4 rounded-2xl font-black text-sm uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-2"
              [ngClass]="frogGame.canFeed() ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 hover:bg-emerald-400' : 'bg-white/10 text-slate-500 cursor-not-allowed'">
        <span class="text-xl">🪲</span>
        <span *ngIf="frogGame.canFeed()">Погодувати!</span>
        <span *ngIf="!frogGame.canFeed()">{{ frogGame.hoursUntilFed() }}г залишилось</span>
      </button>

      <!-- More phrase -->
      <button (click)="openAiChat()"
              class="py-4 rounded-2xl font-black text-sm uppercase tracking-wider bg-white/10 text-white hover:bg-white/20 transition-all active:scale-95 flex items-center justify-center gap-2">
        <i class="fa-solid fa-comment-dots"></i>
        Поговорити
      </button>
    </div>

    <!-- AI Info Popup -->
    <div *ngIf="showAiInfoPopup()" (click)="showAiInfoPopup.set(false)"
         class="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div (click)="$event.stopPropagation()" 
           class="w-full max-w-md bg-slate-900 border border-emerald-500/30 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-emerald-500/10">
        <div class="p-8 text-center">
          <div class="w-20 h-20 bg-emerald-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <i class="fa-solid fa-robot text-4xl text-emerald-400"></i>
          </div>
          <h2 class="text-white text-2xl font-black mb-4">ШІ Чат-Порадник</h2>
          <p class="text-slate-300 text-sm leading-relaxed mb-8">
            Це ваш персональний фінансовий консультант. Він абсолютно <span class="text-emerald-400 font-bold">безкоштовний</span>, 
            але для роботи йому потрібен <span class="text-emerald-400 font-bold">Gemini API Ключ</span>. 
            <br><br>
            Чат аналізує ваші витрати та дає розумні поради щодо економії та планування.
          </p>
          <div class="space-y-3">
            <button (click)="goToSettings()" 
                    class="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-white font-black rounded-2xl transition-all shadow-lg shadow-emerald-500/20 active:scale-95">
              Отримати ключ та Налаштувати
            </button>
            <button (click)="showAiInfoPopup.set(false)" 
                    class="w-full py-4 bg-white/5 hover:bg-white/10 text-slate-400 font-black rounded-2xl transition-all active:scale-95">
              Може пізніше
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- ========== SHOP TAB ========== -->
      <div *ngIf="activeTab === 'shop'" class="relative z-10 px-4 space-y-4">

        <!-- Shop category tabs -->
        <div class="flex gap-2">
          <button *ngFor="let cat of shopCats" (click)="shopTab = cat.id"
                  class="flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                  [ngClass]="shopTab === cat.id ? 'bg-amber-400 text-slate-900' : 'bg-white/10 text-slate-300'">
            {{ cat.label }}
          </button>
        </div>

        <!-- Items -->
        <div class="grid grid-cols-2 gap-3">
          <div *ngFor="let item of filteredShopItems()"
               class="relative rounded-2xl p-4 border transition-all"
               [ngClass]="getItemClass(item)">
            
            <!-- Owned badge -->
            <div *ngIf="frogGame.hasUpgrade(item.id)"
                 class="absolute top-2 right-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
              <i class="fa-solid fa-check text-white text-[10px]"></i>
            </div>

            <!-- Level lock -->
            <div *ngIf="!frogGame.hasUpgrade(item.id) && frog.level < item.minLevel"
                 class="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
              <div class="text-center">
                <div class="text-slate-300 text-xs font-black">🔒 Рівень {{ item.minLevel }}</div>
              </div>
            </div>

            <div class="text-3xl mb-2">{{ item.icon }}</div>
            <h4 class="text-white font-black text-sm leading-tight">{{ item.name }}</h4>
            <p class="text-slate-400 text-[10px] font-bold mt-1">{{ item.description }}</p>
            <button *ngIf="!frogGame.hasUpgrade(item.id) && frog.level >= item.minLevel"
                    (click)="buyItem(item)"
                    class="mt-3 w-full py-2 rounded-xl text-xs font-black uppercase transition-all"
                    [ngClass]="canAfford(item) ? 'bg-amber-400 text-slate-900 hover:bg-amber-300 active:scale-95' : 'bg-white/10 text-slate-500 cursor-not-allowed'">
              🪙 {{ item.cost }}
            </button>
            <div *ngIf="frogGame.hasUpgrade(item.id)" class="mt-3 text-center text-emerald-400 text-xs font-black">
              ✓ Встановлено
            </div>
          </div>
        </div>
      </div>

      <!-- ========== FRIENDS TAB ========== -->
      <div *ngIf="activeTab === 'friends'" class="relative z-10 px-4 space-y-4">
        
        <div *ngIf="visitingFriend === null">
          <div class="bg-white/10 backdrop-blur-sm rounded-3xl p-5 border border-white/20 mb-4">
            <h3 class="text-white font-black text-sm mb-1">Ваш код запрошення:</h3>
            <div class="font-mono text-emerald-300 font-black text-lg tracking-[0.2em]">{{ frog.inviteCode }}</div>
            <p class="text-slate-400 text-xs mt-1">Поділіться з друзями щоб вони могли відвідати вас!</p>
          </div>
          
          <div class="space-y-3">
            <div *ngFor="let friend of npcFriends" 
                 (click)="visitFriend(friend)"
                 class="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 flex items-center gap-4 cursor-pointer hover:bg-white/20 active:scale-98 transition-all">
              <div class="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center"
                   [style.background]="friend.color + '30'">
                <app-frog-character [phase]="friend.phase" [color]="friend.color" [size]="60" [accessories]="[]"></app-frog-character>
              </div>
              <div class="flex-1 min-w-0">
                <h4 class="text-white font-black text-sm">{{ friend.name }}</h4>
                <p class="text-emerald-300 text-xs font-bold">Рівень {{ friend.level }}</p>
                <div class="flex flex-wrap gap-1 mt-1">
                  <span *ngFor="let trait of friend.traits.slice(0,2)" class="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-slate-300 font-bold">{{ trait }}</span>
                </div>
              </div>
              <i class="fa-solid fa-arrow-right text-slate-400"></i>
            </div>
          </div>
        </div>

        <!-- Visiting a friend -->
        <div *ngIf="visitingFriend !== null">
          <button (click)="visitingFriend = null" class="flex items-center gap-2 text-emerald-300 font-black text-sm mb-4 hover:text-white transition-colors">
            <i class="fa-solid fa-arrow-left"></i> Назад до списку
          </button>
          
          <!-- Friend's pond preview (static) -->
          <div class="rounded-3xl overflow-hidden min-h-[260px] relative mb-4"
               [style]="'background: linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%);'">
            <!-- Basic upgrades visualized -->
            <div *ngIf="currentFriend().upgrades.includes('lily_gold')" class="absolute bottom-[46%] left-[45%]">
              <span class="text-3xl animate-pulse">🌟</span>
            </div>
            <div *ngIf="currentFriend().upgrades.includes('waterfall')" class="absolute top-0 right-8 w-3 bottom-[44%] bg-blue-200/50 rounded-b-full"></div>
            <div *ngIf="currentFriend().upgrades.includes('stars')" class="absolute top-2 right-2 flex gap-2 opacity-60">
              <span>⭐</span><span>⭐</span><span>⭐</span>
            </div>
            
            <!-- Friend's frog -->
            <div class="absolute inset-0 flex items-center justify-center" style="padding-bottom: 15%">
              <div class="flex flex-col items-center gap-2">
                <app-frog-character [phase]="currentFriend().phase" [color]="currentFriend().color" [accessories]="currentFriend().upgrades" [size]="120"></app-frog-character>
                <div class="text-white font-black text-lg">{{ currentFriend().name }}</div>
                <span class="text-emerald-300 text-xs font-bold">Рівень {{ currentFriend().level }}</span>
              </div>
            </div>
          </div>

          <!-- Leave message -->
          <div class="bg-white/10 backdrop-blur-sm rounded-3xl p-4 border border-white/20">
            <p class="text-slate-300 text-xs font-bold mb-3">Залишити привітання:</p>
            <div class="grid grid-cols-4 gap-2">
              <button *ngFor="let msg of frogMessages" (click)="sendMessage(msg)"
                      class="py-3 text-xl rounded-xl bg-white/10 hover:bg-white/20 active:scale-90 transition-all">
                {{ msg }}
              </button>
            </div>
            <p *ngIf="messageSent" class="text-emerald-400 text-xs font-black text-center mt-3 animate-pulse">
              Привітання надіслано! +30 XP 🎉
            </p>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`:host { display: block; }`]
})
export class FrogGameComponent implements OnInit, OnDestroy {
  frogGame = inject(FrogGameService);
  financeData = inject(FinanceDataService);
  private router = inject(Router);

  get frog() { return this.frogGame.frog(); }

  activeTab: PageTab = 'home';
  shopTab: ShopTab = 'pond';
  editingName = false;
  newName = '';
  visitingFriend: number | null = null;
  messageSent = false;
  showAiInfoPopup = signal(false);
  private msgTimeout: any;

  npcFriends = NPC_FRIENDS;
  stars = Array.from({ length: 25 }, () => ({ x: Math.random() * 100, y: Math.random() * 60, size: Math.random() * 2 + 1, delay: Math.random() * 3 }));
  fireflies = Array.from({ length: 8 }, () => ({ x: Math.random() * 90, y: Math.random() * 60, delay: Math.random() * 4 }));
  frogMessages = ['🐸', '💚', '👋', '🌿', '✨', '🤍', '🫂', '❤️'];

  tabs = [
    { id: 'home' as PageTab, label: '🏠 Ставок' },
    { id: 'shop' as PageTab, label: '🛍️ Крамниця' },
    { id: 'friends' as PageTab, label: '👥 Друзі' },
  ];

  shopCats = [
    { id: 'pond' as ShopTab, label: '🏊 Ставок' },
    { id: 'frog' as ShopTab, label: '🐸 Жаба' },
    { id: 'atmosphere' as ShopTab, label: '✨ Атм.' },
  ];

  get xpNeeded() {
    return getXpForLevel(this.frog.level);
  }

  get frogColor() {
    if (this.frog.pondUpgrades.includes('color_golden')) return '#f59e0b';
    if (this.frog.pondUpgrades.includes('color_blue')) return '#38bdf8';
    return this.frog.color;
  }

  get pondBackground() {
    const hasFog = this.frogGame.hasUpgrade('fog') && this.isMorning;
    const hasStars = this.frogGame.hasUpgrade('stars') && this.isNight;
    if (hasStars) return 'background: linear-gradient(180deg, #0f172a 0%, #1e3a5f 40%, #065f46 70%, #064e3b 100%)';
    if (hasFog) return 'background: linear-gradient(180deg, #e2e8f0 0%, #94a3b8 20%, #065f46 70%, #064e3b 100%)';
    return 'background: linear-gradient(180deg, #0f4c3a 0%, #065f46 40%, #047857 70%, #064e3b 100%)';
  }

  get isNight() { const h = new Date().getHours(); return h >= 21 || h < 6; }
  get isMorning() { const h = new Date().getHours(); return h >= 6 && h <= 9; }
  get isSleepyTime() { return this.isNight; }

  get moodEmoji() {
    const m: Record<FrogMood, string> = { happy: '😊', bored: '😐', hungry: '😋', sleepy: '😴', excited: '🤩', loving: '🥰' };
    return m[this.frog.mood] ?? '😊';
  }
  get moodLabel() {
    const m: Record<FrogMood, string> = { happy: 'Щаслива', bored: 'Нудно', hungry: 'Голодна', sleepy: 'Сонна', excited: 'Збуджена', loving: 'Закохана' };
    return m[this.frog.mood] ?? 'Щаслива';
  }

  currentFriend() { return NPC_FRIENDS[this.visitingFriend ?? 0]; }

  ngOnInit() {
    this.frogGame.dailyVisit();
    this.frogGame.updateMood();
    this.newName = this.frog.name;
  }

  ngOnDestroy() {
    if (this.msgTimeout) clearTimeout(this.msgTimeout);
  }

  goBack() { this.router.navigate(['/dashboard']); }

  onFrogClick() {
    this.frogGame.triggerAnimation();
    this.frogGame.updatePhrase();
  }

  feed() {
    const success = this.frogGame.feed();
    if (!success) {
      this.frogGame.currentPhrase.set(`Я ще ситна! Повернись через ${this.frogGame.hoursUntilFed()} год. 🐸`);
    }
  }

  saveName() {
    if (this.newName.trim()) this.frogGame.updateName(this.newName.trim());
    this.editingName = false;
  }

  filteredShopItems(): PondUpgrade[] {
    return POND_SHOP_ITEMS.filter((i: PondUpgrade) => i.category === this.shopTab);
  }

  canAfford(item: PondUpgrade) { return this.frogGame.getCoins() >= item.cost; }

  getItemClass(item: PondUpgrade): string {
    if (this.frogGame.hasUpgrade(item.id)) return 'bg-emerald-900/40 border-emerald-500/40';
    if (this.frog.level < item.minLevel) return 'bg-white/5 border-white/10 opacity-50';
    if (!this.canAfford(item)) return 'bg-white/10 border-white/20';
    return 'bg-white/10 border-white/20 hover:bg-white/15 hover:border-emerald-400/50 cursor-pointer';
  }

  buyItem(item: PondUpgrade) {
    const ok = this.frogGame.buyUpgrade(item.id);
    if (!ok) {
      if (!this.canAfford(item)) this.frogGame.currentPhrase.set('Недостатньо монеток! 😢');
    } else {
      this.frogGame.currentPhrase.set(`Чудово! ${item.icon} ${item.name} встановлено!`);
    }
  }

  visitFriend(friend: typeof NPC_FRIENDS[0]) {
    const idx = NPC_FRIENDS.indexOf(friend);
    this.visitingFriend = idx;
    this.frogGame.addXp(30);
    this.messageSent = false;
  }

  sendMessage(msg: string) {
    this.messageSent = true;
    if (this.msgTimeout) clearTimeout(this.msgTimeout);
    this.msgTimeout = setTimeout(() => this.messageSent = false, 3000);
  }

  openAiChat() {
    const apiKey = this.financeData.userSettings().geminiApiKey;
    if (apiKey && apiKey.trim().length > 10) {
      this.router.navigate(['/ai-chat']);
    } else {
      this.showAiInfoPopup.set(true);
    }
  }

  goToSettings() {
    this.showAiInfoPopup.set(false);
    this.router.navigate(['/settings']);
  }
}

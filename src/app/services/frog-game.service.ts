import { Injectable, signal, computed, inject, effect } from '@angular/core';
import { GamificationService } from './gamification.service';
import { FinanceDataService } from './finance-data.service';
import { SettingsService } from './settings.service';

export type FrogPhase = 'egg' | 'tiny-tadpole' | 'tadpole' | 'big-tadpole' | 'tadpole-frog' | 'froglet' | 'young-frog' | 'adult-frog' | 'wise-frog' | 'master-frog' | 'legendary-frog' | 'sensei-frog';
export type FrogMood = 'happy' | 'bored' | 'hungry' | 'sleepy' | 'excited' | 'loving';
export type FrogTrait = 'musician' | 'night-owl' | 'vegan' | 'proud' | 'lazy' | 'hyperactive' | 'gamer' |
  'photographer' | 'elegant' | 'astronomer' | 'comedian' | 'traveler' | 'aristocrat' | 'violinist' | 'athlete' |
  'scientist' | 'romantic' | 'chef' | 'wizard' | 'superhero' | 'night-guard' | 'philosopher' |
  'actor' | 'oracle' | 'juggler' | 'champion' | 'star' | 'meditator' | 'perfectionist' | 'generous' | 'coffeelover' | 'surfer';

export interface PondUpgrade {
  id: string;
  name: string;
  cost: number;
  category: 'pond' | 'frog' | 'atmosphere';
  icon: string;
  description: string;
  minLevel: number;
}

export interface FrogGameData {
  version: number;
  name: string;
  level: number;
  xp: number;
  phase: FrogPhase;
  traits: FrogTrait[];
  color: string;
  accessories: string[];
  pondUpgrades: string[];
  lastFed: number;
  lastDailyVisit: number;
  mood: FrogMood;
  totalXpEarned: number;
  inviteCode: string;
}

const STORAGE_KEY = 'eta_frog_game_data';
const XP_PER_LEVEL = 100;

export const POND_SHOP_ITEMS: PondUpgrade[] = [
  // Pond Environment
  { id: 'lily_1', name: 'Лілія', cost: 30, category: 'pond', icon: '🌸', description: 'Перша лілія у ставку', minLevel: 1 },
  { id: 'lily_3', name: '3 Лілії', cost: 80, category: 'pond', icon: '🪷', description: 'Три лілії для відпочинку', minLevel: 5 },
  { id: 'lily_gold', name: 'Золота Лілія', cost: 200, category: 'pond', icon: '✨', description: 'Магічна золота лілія', minLevel: 20 },
  { id: 'rocks', name: 'Каміння', cost: 50, category: 'pond', icon: '🪨', description: 'Красиві камені по берегах', minLevel: 3 },
  { id: 'reeds', name: 'Очерет', cost: 60, category: 'pond', icon: '🌾', description: 'Очерет залучає комах', minLevel: 5 },
  { id: 'bridge', name: 'Місток', cost: 250, category: 'pond', icon: '🌉', description: 'Дерев\'яний місток через ставок', minLevel: 15 },
  { id: 'waterfall', name: 'Водоспад', cost: 300, category: 'pond', icon: '💧', description: 'Заспокійливий водоспад', minLevel: 25 },
  { id: 'lanterns', name: 'Ліхтарики', cost: 120, category: 'atmosphere', icon: '🏮', description: 'Вечірнє освітлення', minLevel: 10 },
  { id: 'fish', name: 'Рибки', cost: 200, category: 'pond', icon: '🐟', description: 'Рибки плавають у глибині', minLevel: 18 },
  { id: 'fireflies', name: 'Світлячки', cost: 150, category: 'atmosphere', icon: '✨', description: 'Вночі летять світлячки', minLevel: 12 },
  { id: 'tree', name: 'Дерево', cost: 180, category: 'pond', icon: '🌳', description: 'Дерево дає тінь жабі', minLevel: 8 },
  { id: 'fog', name: 'Туман', cost: 200, category: 'atmosphere', icon: '🌫️', description: 'Ранковий туман о 6–9 ранку', minLevel: 30 },
  { id: 'stars', name: 'Зоряне небо', cost: 350, category: 'atmosphere', icon: '⭐', description: 'Прекрасне нічне небо', minLevel: 35 },
  { id: 'seasons', name: 'Смена сезонів', cost: 600, category: 'atmosphere', icon: '🍂', description: 'Зима, весна, літо, осінь', minLevel: 50 },
  { id: 'npc_frog', name: 'Сусід-жаб', cost: 100, category: 'pond', icon: '🐸', description: 'Дикий сусід у ставку', minLevel: 20 },
  { id: 'npc_wise', name: 'Мудрий Дід-Жаб', cost: 350, category: 'pond', icon: '🧙', description: 'Дає мудрі поради', minLevel: 40 },
  
  // Frog Accessories
  { id: 'hat_flower', name: 'Квітка', cost: 50, category: 'frog', icon: '🌺', description: 'Квіточка на голові жаби', minLevel: 1 },
  { id: 'hat_basic', name: 'Капелюх', cost: 80, category: 'frog', icon: '🎩', description: 'Класичний капелюх', minLevel: 5 },
  { id: 'glasses_cool', name: 'Окуляри', cost: 100, category: 'frog', icon: '😎', description: 'Круті сонцезахисні окуляри', minLevel: 8 },
  { id: 'bow_tie', name: 'Метелик', cost: 110, category: 'frog', icon: '🎀', description: 'Елегантний метелик', minLevel: 10 },
  { id: 'scarf', name: 'Шарф', cost: 90, category: 'frog', icon: '🧣', description: 'Теплий шарф взимку', minLevel: 12 },
  { id: 'glasses_round', name: 'Круглі Окуляри', cost: 120, category: 'frog', icon: '🤓', description: 'Інтелектуальний вигляд', minLevel: 15 },
  { id: 'cape', name: 'Плащ', cost: 180, category: 'frog', icon: '🦸', description: 'Супергеройський плащ', minLevel: 20 },
  { id: 'hat_wizard', name: 'Шапка Мага', cost: 200, category: 'frog', icon: '🧙', description: 'Чарівна шапка з зірками', minLevel: 25 },
  { id: 'hat_crown', name: 'Корона', cost: 300, category: 'frog', icon: '👑', description: '24-каратна золота корона', minLevel: 35 },
  { id: 'color_blue', name: 'Синій Відтінок', cost: 200, category: 'frog', icon: '💙', description: 'Синє забарвлення жаби', minLevel: 20 },
  { id: 'color_golden', name: 'Золота Жаба', cost: 500, category: 'frog', icon: '🌟', description: 'Легендарне золоте забарвлення', minLevel: 45 },
  { id: 'aura_gold', name: 'Золота Аура', cost: 400, category: 'frog', icon: '✨', description: 'Золоте свічення навколо жаби', minLevel: 40 },
  { id: 'eyes_hearts', name: 'Очі-Серця', cost: 150, category: 'frog', icon: '🥰', description: 'Закохані очі-серця', minLevel: 15 },
  { id: 'coffee', name: 'Кавова Чашка', cost: 80, category: 'frog', icon: '☕', description: 'Жаба п\'є каву зранку', minLevel: 5 },
  { id: 'backpack', name: 'Рюкзак', cost: 160, category: 'frog', icon: '🎒', description: 'Рюкзак мандрівниці', minLevel: 18 },
];

const FROG_PHRASES: Record<string, string[]> = {
  general: [
    'Ква-ква! Сьогодні гарна погода для ставка!',
    'А ти знав, що жаби можуть бачити позаду?',
    'Мій ставок — моя фортеця 🏰',
    'Я думаю... отже я жаба.',
    'Гарний день щоб нічого не робити.',
    'Чув, що монети не ростуть на деревах? Жаль.',
    'Ква! Привіт, провідник мій!',
  ],
  financial: [
    'Схоже, цього місяця ти непогано тримаєшся!',
    'Жаби не витрачають більше, ніж ловлять мух.',
    'Мудра жаба завжди відкладає кілька мошок на чорний день.',
    'Ква! Перевір свої витрати — щось виглядає підозріло.',
  ],
  hungry: [
    '... *шлунок гарчить* ... ква.',
    'Якщо ти годуватимеш мене вчасно, я буду щаслива!',
    'Я голодна 😢 Де мої мухи?',
    'Навіть жаби потребують їжі! КВА!',
  ],
  happy: [
    'КВА-КВА-КВА! Сьогодні чудовий день!',
    'Ти найкращий господар у світі! ✨',
    'Моє серце наповнене радістю! І мухами.',
    'Я ЛЮБЛЮ СВІЙ СТАВОК!',
  ],
  levelup: [
    'Я виросла! Відчуваю як додалась мудрість! 🌟',
    'Новий рівень! Я стаю все більш жабою!',
    'Ква-ка-ка! Якесь нове відчуття... мабуть, це зрілість.',
  ],
};

export function getPhaseForLevel(level: number): FrogPhase {
  if (level < 3) return 'egg';
  if (level < 6) return 'tiny-tadpole';
  if (level < 11) return 'tadpole';
  if (level < 16) return 'big-tadpole';
  if (level < 21) return 'tadpole-frog';
  if (level < 26) return 'froglet';
  if (level < 36) return 'young-frog';
  if (level < 56) return 'adult-frog';
  if (level < 66) return 'wise-frog';
  if (level < 76) return 'master-frog';
  if (level < 86) return 'legendary-frog';
  return 'sensei-frog';
}

export function getXpForLevel(level: number): number {
  return Math.floor(XP_PER_LEVEL * (1 + level * 0.3));
}

export function getTraitsForLevel(level: number): FrogTrait[] {
  const allTraits: FrogTrait[] = ['musician','night-owl','vegan','proud','lazy','hyperactive','gamer','photographer','elegant','astronomer','comedian','traveler','aristocrat','violinist','athlete','scientist','romantic','chef','wizard','superhero','night-guard','philosopher','actor','oracle','juggler','champion','star','meditator','perfectionist','generous','coffeelover','surfer'];
  
  // Seed based on first 8 chars of invite code that should be stable
  const seed = level * 7 + 13;
  const result: FrogTrait[] = [];
  
  if (level >= 21) result.push(allTraits[seed % 7]);
  if (level >= 31) result.push(allTraits[(seed * 3) % 14 + 7]);
  if (level >= 46) result.push(allTraits[(seed * 5) % 11 + 14]);
  if (level >= 66) result.push(allTraits[(seed * 7) % 10 + 22]);
  
  return result;
}

@Injectable({ providedIn: 'root' })
export class FrogGameService {
  private gamification = inject(GamificationService);
  private financeData = inject(FinanceDataService);
  private settingsService = inject(SettingsService);

  frog = signal<FrogGameData>(this.getDefaultFrog());
  currentPhrase = signal<string>('Ква... завантажуємо ставок...');
  isAnimating = signal<boolean>(false);

  constructor() {
    this.loadFrog();
    this.updatePhrase();
    this.syncXpFromTransactions();

    // Update phrase every 90 minutes
    setInterval(() => this.updatePhrase(), 90 * 60 * 1000);

    // Auto-save on changes
    effect(() => {
      const data = this.frog();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    });
  }

  private getDefaultFrog(): FrogGameData {
    return {
      version: 1,
      name: 'Ква-Ква',
      level: 1,
      xp: 0,
      phase: 'egg',
      traits: [],
      color: '#4ade80',
      accessories: [],
      pondUpgrades: [],
      lastFed: 0,
      lastDailyVisit: 0,
      mood: 'happy',
      totalXpEarned: 0,
      inviteCode: Math.random().toString(36).substring(2, 10).toUpperCase(),
    };
  }

  private loadFrog() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved) as FrogGameData;
        // Recalc phase/traits on load
        data.phase = getPhaseForLevel(data.level);
        data.traits = getTraitsForLevel(data.level);
        this.frog.set(data);
      } catch {
        // corrupt data → start fresh
      }
    }
  }

  private syncXpFromTransactions() {
    // Give XP based on total spent/income transactions 
    effect(() => {
      const txCount = this.financeData.transactions().length;
      const current = this.frog();
      const expectedXp = txCount * 50;
      if (expectedXp > current.totalXpEarned) {
        const diff = expectedXp - current.totalXpEarned;
        this.addXp(diff, false);
      }
    });
  }

  addXp(amount: number, showAnim = true) {
    const current = this.frog();
    let xp = current.xp + amount;
    let level = current.level;
    let leveled = false;

    while (xp >= getXpForLevel(level)) {
      xp -= getXpForLevel(level);
      level = Math.min(level + 1, 99);
      leveled = true;
    }

    const phase = getPhaseForLevel(level);
    const traits = getTraitsForLevel(level);

    this.frog.update(f => ({
      ...f,
      xp,
      level,
      phase,
      traits,
      totalXpEarned: f.totalXpEarned + amount,
    }));

    if (leveled) {
      this.currentPhrase.set(FROG_PHRASES['levelup'][Math.floor(Math.random() * FROG_PHRASES['levelup'].length)]);
      if (showAnim) this.triggerAnimation();
    }
  }

  feed() {
    const now = Date.now();
    const last = this.frog().lastFed;
    const canFeed = now - last > 4 * 60 * 60 * 1000; // every 4 hours

    if (!canFeed) return false;

    this.frog.update(f => ({ ...f, lastFed: now, mood: 'happy' }));
    this.addXp(10);
    this.currentPhrase.set('КВА! СМАЧНО! Дякую! 🐛');
    this.triggerAnimation();
    return true;
  }

  canFeed(): boolean {
    const now = Date.now();
    return now - this.frog().lastFed > 4 * 60 * 60 * 1000;
  }

  hoursUntilFed(): number {
    const now = Date.now();
    const next = this.frog().lastFed + 4 * 60 * 60 * 1000;
    return Math.max(0, Math.ceil((next - now) / (60 * 60 * 1000)));
  }

  dailyVisit() {
    const now = Date.now();
    const today = new Date(now).toDateString();
    const lastDay = new Date(this.frog().lastDailyVisit).toDateString();
    if (today !== lastDay) {
      this.frog.update(f => ({ ...f, lastDailyVisit: now }));
      this.addXp(25);
    }
  }

  buyUpgrade(id: string): boolean {
    const item = POND_SHOP_ITEMS.find(i => i.id === id);
    if (!item) return false;

    const coins = this.financeData.userSettings().coins || 0;
    if (coins < item.cost) return false;
    if (this.frog().pondUpgrades.includes(id)) return false;
    if (this.frog().level < item.minLevel) return false;

    this.gamification.addCoins(-item.cost);
    this.frog.update(f => ({ ...f, pondUpgrades: [...f.pondUpgrades, id] }));
    this.addXp(20);
    return true;
  }

  hasUpgrade(id: string): boolean {
    return this.frog().pondUpgrades.includes(id);
  }

  getCoins(): number {
    return this.financeData.userSettings().coins || 0;
  }

  updateName(name: string) {
    this.frog.update(f => ({ ...f, name }));
  }

  updatePhrase() {
    const mood = this.frog().mood;
    const hungryCheck = !this.canFeed() ? 'general' : Date.now() - this.frog().lastFed > 8 * 60 * 60 * 1000 ? 'hungry' : 'general';
    const pool = FROG_PHRASES[hungryCheck] || FROG_PHRASES['general'];
    this.currentPhrase.set(pool[Math.floor(Math.random() * pool.length)]);
  }

  updateMood() {
    const lastFed = this.frog().lastFed;
    const hoursSinceFed = (Date.now() - lastFed) / (60 * 60 * 1000);
    
    let mood: FrogMood = 'happy';
    if (hoursSinceFed > 6) mood = 'hungry';
    else if (hoursSinceFed > 3) mood = 'bored';
    else if (Math.random() > 0.7) mood = 'excited';

    const hour = new Date().getHours();
    if (hour >= 23 || hour < 6) mood = 'sleepy';

    this.frog.update(f => ({ ...f, mood }));
  }

  triggerAnimation() {
    this.isAnimating.set(true);
    setTimeout(() => this.isAnimating.set(false), 800);
  }

  getXpProgress(): number {
    const f = this.frog();
    const needed = getXpForLevel(f.level);
    return f.level >= 99 ? 100 : Math.round((f.xp / needed) * 100);
  }

  getPhaseName(): string {
    const names: Record<FrogPhase, string> = {
      'egg': 'Яєчко 🥚',
      'tiny-tadpole': 'Крихітний Пуголовок',
      'tadpole': 'Пуголовок',
      'big-tadpole': 'Великий Пуголовок',
      'tadpole-frog': 'Жабо-пуголовок',
      'froglet': 'Жабеня',
      'young-frog': 'Молода Жаба',
      'adult-frog': 'Доросла Жаба',
      'wise-frog': 'Мудра Жаба',
      'master-frog': 'Жаба-Майстер',
      'legendary-frog': 'Легендарна Жаба',
      'sensei-frog': 'Жаба-Сенсей',
    };
    return names[this.frog().phase];
  }

  getTraitName(trait: FrogTrait): string {
    const names: Record<FrogTrait, string> = {
      'musician': '🎵 Меломан', 'night-owl': '🦉 Сова', 'vegan': '🌿 Веган', 'proud': '😤 Гордовита',
      'lazy': '💤 Лінива', 'hyperactive': '🤩 Гіперактивна', 'gamer': '🎮 Геймер',
      'photographer': '📸 Фотограф', 'elegant': '🎩 Елегантна', 'astronomer': '🔭 Астроном',
      'comedian': '😂 Гуморист', 'traveler': '🌍 Мандрівниця', 'aristocrat': '👑 Аристократ',
      'violinist': '🎻 Скрипалька', 'athlete': '💪 Спортсменка', 'scientist': '🧪 Вчена',
      'romantic': '🌹 Романтик', 'chef': '🍳 Кухарка', 'wizard': '🧙 Маг',
      'superhero': '🦸 Супергерой', 'night-guard': '🌙 Нічна Варта', 'philosopher': '📖 Філософ',
      'actor': '🎭 Акторка', 'oracle': '🔮 Провидиця', 'juggler': '🎪 Циркач',
      'champion': '🏆 Чемпіон', 'star': '🌟 Зірка', 'meditator': '🧘 Медитатор',
      'perfectionist': '🎯 Перфекціоніст', 'generous': '🎁 Щедра', 'coffeelover': '☕ Кавоман',
      'surfer': '🌊 Серфер',
    };
    return names[trait] || trait;
  }
}

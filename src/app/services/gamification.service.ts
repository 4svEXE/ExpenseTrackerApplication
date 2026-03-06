import { Injectable, signal, inject, computed, effect } from '@angular/core';
import { FinanceDataService } from './finance-data.service';
import { AudioService } from './audio.service';

export interface GameOutcome {
    text: string;
    reward: number;
    probability: number;
}

export interface GameChoice {
    text: string;
    cost: number;
    outcomes: GameOutcome[];
}

export interface GameEvent {
    id: string;
    text: string;
    iconUrl: string;
    choices: GameChoice[];
}

@Injectable({
    providedIn: 'root'
})
export class GamificationService {
    private financeData = inject(FinanceDataService);
    private audio = inject(AudioService);

    currentEvent = signal<GameEvent | null>(null);
    eventResult = signal<{ text: string, reward: number } | null>(null);
    nextEventTime = signal<number>(0);

    activeAchievement = signal<Achievement | null>(null);
    isInfoModalOpen = signal(false);

    toggleInfoModal() {
        this.isInfoModalOpen.set(!this.isInfoModalOpen());
    }

    private readonly STORAGE_KEY = 'gamification_state_v3';
    private notifiedPlans = new Set<string>();

    constructor() {
        this.loadState();

        if (!this.currentEvent() && !this.eventResult() && Date.now() >= this.nextEventTime()) {
            this.generateNewEvent();
        }

        setInterval(() => {
            if (Date.now() >= this.nextEventTime() && !this.currentEvent() && !this.eventResult()) {
                this.generateNewEvent();
            }
            this.updateAchievementProgress();
        }, 30000); // Check more frequently for progress

        // Watch for plan completions
        effect(() => {
            const iPlans = this.financeData.incomePlans();
            const ePlans = this.financeData.expensePlans();
            const txs = this.financeData.transactions(); // Trigger when transactions change

            this.checkExternalProgress();
        });

        effect(() => {
            this.saveState();
        });
    }

    private loadState() {
        const saved = localStorage.getItem(this.STORAGE_KEY);
        if (saved) {
            const state = JSON.parse(saved);
            this.currentEvent.set(state.currentEvent);
            this.eventResult.set(state.eventResult);
            this.nextEventTime.set(state.nextEventTime || 0);
            this.activeAchievement.set(state.activeAchievement);
            if (state.notifiedPlans) {
                this.notifiedPlans = new Set(state.notifiedPlans);
            }
        }
    }

    private saveState() {
        const state = {
            currentEvent: this.currentEvent(),
            eventResult: this.eventResult(),
            nextEventTime: this.nextEventTime(),
            activeAchievement: this.activeAchievement(),
            notifiedPlans: Array.from(this.notifiedPlans)
        };
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
    }

    generateNewEvent() {
        if (!this.financeData.userSettings().eventsEnabled) return;

        const event = { ...FANTASY_EVENTS[Math.floor(Math.random() * FANTASY_EVENTS.length)] };
        const seed = Math.random().toString(36).substring(7);
        event.iconUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9`;

        this.currentEvent.set(event);
        this.eventResult.set(null);

        const userName = this.financeData.userSettings().name;
        const isAdmin = userName === 'Бог' || userName === 'Адмін';
        const delay = isAdmin ? 5000 : 4 * 60 * 60 * 1000;

        this.nextEventTime.set(Date.now() + delay);
    }

    makeChoice(choiceIndex: number) {
        const event = this.currentEvent();
        if (!event) return;

        const choice = event.choices[choiceIndex];
        const userCoins = this.financeData.userSettings().coins || 0;

        if (userCoins < choice.cost) {
            this.eventResult.set({ text: 'У вас недостатньо монет для цього вибору! 😢', reward: 0 });
            return;
        }

        if (choice.cost > 0) this.financeData.addCoins(-choice.cost);

        const rand = Math.random();
        let cumulativeProb = 0;
        let selectedOutcome = choice.outcomes[choice.outcomes.length - 1];

        for (const out of choice.outcomes) {
            cumulativeProb += out.probability;
            if (rand <= cumulativeProb) {
                selectedOutcome = out;
                break;
            }
        }

        this.financeData.addCoins(selectedOutcome.reward);
        if (selectedOutcome.reward > 0) this.audio.playIncome();
        else if (selectedOutcome.reward < 0) this.audio.playOutcome();

        this.eventResult.set({ text: selectedOutcome.text, reward: selectedOutcome.reward });
        this.currentEvent.set(null);

        // Track choice for achievement
        this.incrementAchievementProgress('choices');
    }

    finishEvent() {
        this.eventResult.set(null);
    }

    private checkExternalProgress() {
        const now = new Date();
        const m = now.getMonth();
        const y = now.getFullYear();

        // Income
        this.financeData.incomePlans().forEach(plan => {
            const planKey = `plan-inc-${plan.id}-${m}-${y}`;
            if (this.notifiedPlans.has(planKey)) return;

            const fact = this.financeData.transactions()
                .filter(t => t.type === 'income' && t.date.getMonth() === m && t.date.getFullYear() === y &&
                    (t.tags.some(tag => tag.toLowerCase() === plan.category.toLowerCase()) || t.category === plan.category))
                .reduce((s, t) => s + (t.amountUah || 0), 0);

            if (fact >= plan.planAmount && plan.planAmount > 0) {
                this.onPlanCompleted(planKey);
            }
        });

        // Expense
        this.financeData.expensePlans().forEach(plan => {
            const planKey = `plan-exp-${plan.id}-${m}-${y}`;
            if (this.notifiedPlans.has(planKey)) return;

            const fact = this.financeData.transactions()
                .filter(t => t.type === 'expense' && t.date.getMonth() === m && t.date.getFullYear() === y &&
                    (t.tags.some(tag => tag.toLowerCase() === plan.category.toLowerCase()) || t.category === plan.category))
                .reduce((s, t) => s + (t.amountUah || 0), 0);

            if (fact >= plan.amount && plan.amount > 0) {
                this.onPlanCompleted(planKey);
            }
        });
    }

    private onPlanCompleted(key: string) {
        this.notifiedPlans.add(key);
        this.financeData.addCoins(10);
        this.incrementAchievementProgress('plans');
        this.saveState();
    }

    skipTime() {
        if (this.financeData.userSettings().coins! >= 10) {
            this.financeData.addCoins(-10);
            this.generateNewEvent();
        }
    }

    speedUp() {
        if (this.financeData.userSettings().coins! >= 1) {
            this.financeData.addCoins(-1);
            // 20 minutes in ms = 1,200,000
            this.nextEventTime.update(val => val - 1200000);
            this.saveState();
        }
    }

    claimAchievement() {
        const achiev = this.activeAchievement();
        if (achiev && achiev.completed) {
            this.financeData.addCoins(achiev.reward);
            this.audio.playChallengeComplete();
            this.activeAchievement.set(null);
            this.initNewAchievement();
        }
    }

    // Call this whenever a relevant action happens
    incrementAchievementProgress(type: 'choices' | 'plans') {
        const achiev = this.activeAchievement();
        if (achiev && !achiev.completed && achiev.type === type) {
            const nextVal = (achiev.current || 0) + 1;
            this.activeAchievement.set({
                ...achiev,
                current: nextVal,
                completed: nextVal >= achiev.target
            });
        }
    }

    private updateAchievementProgress() {
        if (!this.activeAchievement()) {
            this.initNewAchievement();
            return;
        }

        const achiev = this.activeAchievement()!;
        if (achiev.completed) return;

        // Auto-check for coin-based achievements
        if (achiev.type === 'coins') {
            const currentCoins = this.financeData.userSettings().coins || 0;
            if (currentCoins >= achiev.target) {
                this.activeAchievement.set({ ...achiev, current: currentCoins, completed: true });
            }
        }
    }

    private initNewAchievement() {
        const pool: Omit<Achievement, 'completed' | 'current'>[] = [
            { id: 'a1', text: 'Накопичити 100 монет', reward: 50, type: 'coins', target: 100 },
            { id: 'a2', text: 'Накопичити 500 монет', reward: 200, type: 'coins', target: 500 },
            { id: 'a3', text: 'Зробити 5 виборів у подіях', reward: 30, type: 'choices', target: 5 },
            { id: 'a4', text: 'Зробити 10 виборів у подіях', reward: 70, type: 'choices', target: 10 },
            { id: 'a5', text: 'Виконати 3 фінансові плани', reward: 40, type: 'plans', target: 3 },
            { id: 'a6', text: 'Виконати 10 фінансових планів', reward: 150, type: 'plans', target: 10 }
        ];

        const selected = pool[Math.floor(Math.random() * pool.length)];
        this.activeAchievement.set({
            ...selected,
            current: selected.type === 'coins' ? (this.financeData.userSettings().coins || 0) : 0,
            completed: false
        });

        // Final check immediately
        this.updateAchievementProgress();
    }

    get timeUntilNext(): string {
        const diff = this.nextEventTime() - Date.now();
        if (diff <= 0) return '00:00:00';
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
}

export interface Achievement {
    id: string;
    text: string;
    reward: number;
    type: 'coins' | 'choices' | 'plans';
    target: number;
    current: number;
    completed: boolean;
}

const FANTASY_EVENTS: GameEvent[] = [
    {
        id: 'f1',
        text: 'Старий маг пропонує вам випити зілля невідомого кольору. Це може бути еліксир багатства або просто прострочений сік.',
        iconUrl: '', // Will be set in generateNewEvent
        choices: [
            {
                text: 'Випити (3 монети)',
                cost: 3,
                outcomes: [
                    { text: 'Ваші кишені наповнилися золотом! Ви відчуваєте прилив сил.', reward: 5, probability: 0.3 },
                    { text: 'Це було звичайне молоко, але кумедно пахло.', reward: 0, probability: 0.4 },
                    { text: 'Ой... здається зілля було зіпсоване. Ви втратили трохи монет, поки бігли до кущів.', reward: -5, probability: 0.3 }
                ]
            },
            {
                text: 'Відмовитись',
                cost: 0,
                outcomes: [{ text: 'Ви ввічливо відмовились. Маг бурчить щось про невдячних героїв.', reward: 0, probability: 1.0 }]
            }
        ]
    },
    {
        id: 'f2',
        text: 'Ви знайшли сплячого дракона, набитого золотом. Один золотий злиток лежить зовсім поруч з його носом.',
        iconUrl: '', // Will be set in generateNewEvent
        choices: [
            {
                text: 'Спробувати забрати',
                cost: 0,
                outcomes: [
                    { text: 'Ви тихо забрали злиток! Дракон навіть не ворухнувся.', reward: 5, probability: 0.2 },
                    { text: 'Дракон чхнув вогнем! Ви ледь встигли відскочити, але край гаманця підгорів.', reward: -5, probability: 0.8 }
                ]
            },
            {
                text: 'Тихо піти',
                cost: 0,
                outcomes: [{ text: 'Безпека понад усе. Ви зберегли своє життя та монети.', reward: 0, probability: 1.0 }]
            }
        ]
    }
];

const creatureAdjectives = [
    'П’яний', 'Магічний', 'Мандрівний', 'Старий', 'Хитрий', 'Шалений', 'Проклятий', 'Таємничий',
    'Золотий', 'Древній', 'Могутній', 'Сумний', 'Загадковий', 'Лихий', 'Добрий', 'Невловимий',
    'Мудрий', 'Загублений', 'Грізний', 'Великий', 'Скупий', 'Веселий', 'Зачарований', 'Кривавий',
    'Сяючий', 'Мовчазний', 'Суворий', 'Хижацький', 'Лагідний', 'Божевільний', 'Сліпий', 'Німий',
    'Гордий', 'Жадібний', 'Щедрий', 'Відважний', 'Лякливий', 'Вірний', 'Підступний', 'Тіньовий',
    'Зоряний', 'Місячний', 'Сонячний', 'Пекельний', 'Небесний', 'Гірський', 'Лісовий', 'Морський',
    'Пустельний', 'Сніговий', 'Туманний', 'Грозовий', 'Вітряний', 'Кам’яний', 'Залізний', 'Срібний',
    'Мідний', 'Кришталевий', 'Смарагдовий', 'Рубіновий', 'Чорний', 'Білий', 'Сірий', 'Червоний',
    'Синій', 'Зелений', 'Жовтий', 'Фіолетовий', 'Блакитний', 'Пурпуровий', 'Сріблястий', 'Бронзовий',
    'Сталевий', 'Дерев’яний', 'Шкіряний', 'Скляний', 'Крижаний', 'Вогняний', 'Водяний', 'Повітряний',
    'Земляний', 'Електричний', 'Брутальний', 'Елегантний', 'Дикий', 'Приручений', 'Огидний', 'Прекрасний',
    'Гнилий', 'Свіжий', 'Смердючий', 'Запашний', 'Швидкий', 'Повільний', 'Молодий', 'Вічний', 'Примарний',
    'Механічний', 'Органічний', 'Цифровий', 'Аналоговий', 'Рідкісний', 'Звичайний', 'Епічний'
];

const creatureNouns = [
    'Огр', 'Ельф', 'Гном', 'Єнот', 'Лицар', 'Гоблін', 'Дракон', 'Лепрекон', 'Некромант',
    'Алхімік', 'Поет', 'Мандрівник', 'Маг', 'Троль', 'Орк', 'Паладин', 'Бард', 'Селянин',
    'Дворф', 'Торговець', 'Інспектор', 'Король-вигнанець', 'Гурман', 'Гарпія', 'Мінотавр',
    'Кентавр', 'Сатир', 'Німфа', 'Дріада', 'Сирена', 'Сфінкс', 'Грифон', 'Пегас', 'Фенікс',
    'Василіск', 'Гідра', 'Химера', 'Мантикора', 'Виверна', 'Кракен', 'Цербер', 'Циклоп',
    'Велетень', 'Титан', 'Голем', 'Горгулья', 'Вампір', 'Перевертень', 'Зомбі', 'Скелет',
    'Ліч', 'Мумія', 'Банші', 'Тінь', 'Елементаль', 'Джин', 'Іфрит', 'Сильф', 'Ундіна',
    'Кобольд', 'Багбір', 'Суккуб', 'Демон', 'Ангел', 'Фавн', 'Людожер', 'Варвар', 'Пірат',
    'Розбійник', 'Друїд', 'Шаман', 'Жрець', 'Чернець', 'Ассасин', 'Рейнджер', 'Коваль',
    'Ювелір', 'Ганчар', 'Мисливець', 'Рибалка', 'Пастух', 'Кухар', 'Блазень', 'Музикант',
    'Стражник', 'Капітан', 'Барон', 'Граф', 'Герцог', 'Принц', 'Король', 'Імператор',
    'Пророк', 'Відлюдник', 'Гвардієць', 'Найманець', 'Шпигун', 'Слідопит', 'Чаклун', 'Заклинатель'
];

const itemAdjectives = [
    'Магічний', 'Забутий', 'Таємничий', 'Проклятий', 'Древній', 'Золотий', 'Блискучий',
    'Дивний', 'Загублений', 'Священний', 'Темний', 'Крижаний', 'Вогняний', 'Примарний',
    'Іржавий', 'Ельфійський', 'Гномський', 'Орчий', 'Королівський', 'Підозрілий', 'Рідкісний',
    'Звичайний', 'Незвичайний', 'Епічний', 'Легендарний', 'Міфічний', 'Архаїчний', 'Футуристичний',
    'Поламаний', 'Відремонтований', 'Новий', 'Старий', 'Потертий', 'Тьмяний', 'Сяючий',
    'Мерехтливий', 'Пульсуючий', 'Гарчащий', 'Шепочучий', 'Співаючий', 'Плачучий', 'Сміючий',
    'Холодний', 'Гарячий', 'Теплий', 'Прохолодний', 'Липкий', 'Слизький', 'Гладкий', 'Шорсткий',
    'Твердий', 'М’який', 'Важкий', 'Легкий', 'Гострий', 'Тупий', 'Довгий', 'Короткий',
    'Широкий', 'Вузький', 'Круглий', 'Квадратний', 'Трикутний', 'Зірчастий', 'Серцеподібний',
    'Міцний', 'Крихкий', 'Прозорий', 'Матовий', 'Кольоровий', 'Однотонний', 'Візерунчастий',
    'Антимагічний', 'Осквернений', 'Благословенний', 'Отруєний', 'Цілющий', 'Захисний',
    'Атакуючий', 'Допоміжний', 'Декоративний', 'Музичний', 'Кулінарний', 'Алхімічний',
    'Ковальський', 'Інженерний', 'Ткацький', 'Кравецький', 'Ювелірний', 'Друкарський',
    'Письменницький', 'Художній', 'Будівельний', 'Землеробський', 'Рибальський', 'Мисливський',
    'Зірковий', 'Місячний', 'Сонячний', 'Небесний', 'Пекельний', 'Безодневий', 'Космічний'
];

const itemNouns = [
    'амулет', 'ключ', 'кристал', 'сувій', 'зуб дракона', 'гриб', 'перстень', 'кубок',
    'шолом', 'меч', 'артефакт', 'компас', 'камінь', 'ріг', 'посох', 'флакон', 'жезл',
    'браслет', 'намисто', 'сережки', 'пояс', 'плащ', 'чоботи', 'рукавиці', 'наручі',
    'поножі', 'кіраса', 'щит', 'лук', 'арбалет', 'стріла', 'спис', 'сокира', 'молот',
    'булава', 'кинджал', 'рапіра', 'шабля', 'скрамасакс', 'глефа', 'алебарда', 'коса',
    'ціп', 'праща', 'бомба', 'пастка', 'зілля', 'еліксир', 'настоянка', 'відвар',
    'мазь', 'порошок', 'книга', 'гримуар', 'щоденник', 'лист', 'карта', 'креслення',
    'статуетка', 'фігурка', 'лялька', 'іграшка', 'інструмент', 'молоток', 'кліщі',
    'пилка', 'ніж', 'шило', 'голка', 'мотузка', 'ланцюг', 'замок', 'скриня', 'сумка',
    'рюкзак', 'мішок', 'гаманець', 'дзеркало', 'гребінець', 'мило', 'рушник', 'чаша',
    'тарілка', 'ложка', 'вилка', 'казанок', 'сковорода', 'лампа', 'свічка', 'факел',
    'трубка', 'корінь', 'квітка', 'череп', 'око', 'серце', 'перо', 'кіготь', 'панцир'
];

const scenarios = [
    {
        text: (c: string, i: string) => `${c} пропонує вам купити ${i}. Виглядає підозріло, але ціна приваблива.`,
        choicePos: 'Купити',
        choiceNeg: 'Ні'
    },
    {
        text: (c: string, i: string) => `${c} кличе вас зіграти в кості на ${i}. Ризик — благородна справа?`,
        choicePos: 'Грати',
        choiceNeg: 'Ні'
    },
    {
        text: (c: string, i: string) => `Ви бачите, як ${c} впустив ${i} у багнюку. Що зробите?`,
        choicePos: 'Підняти',
        choiceNeg: 'Ігнор'
    },
    {
        text: (c: string, i: string) => `${c} благає про допомогу! У нього відібрали ${i}. Потрібні гроші на викуп.`,
        choicePos: 'Допомогти',
        choiceNeg: 'Пройти повз'
    },
    {
        text: (c: string, i: string) => `На стіні таверни оголошення: "Знайдіть ${i}. Нагорода від ${c} гарантована".`,
        choicePos: 'Взяти завдання',
        choiceNeg: 'Відмовитись'
    }
];

for (let i = 3; i <= 200; i++) {
    const adj = creatureAdjectives[Math.floor(Math.random() * creatureAdjectives.length)];
    const noun = creatureNouns[Math.floor(Math.random() * creatureNouns.length)];

    const iAdj = itemAdjectives[Math.floor(Math.random() * itemAdjectives.length)];
    const iNoun = itemNouns[Math.floor(Math.random() * itemNouns.length)];
    const item = `${iAdj} ${iNoun}`;

    const scn = scenarios[Math.floor(Math.random() * scenarios.length)];

    const cre = `${adj} ${noun}`;
    // Limit cost/reward to 5 max as per user request
    const baseCost = Math.floor(Math.random() * 3) + 1; // 1-3 cost 
    const isHighRisk = Math.random() > 0.7;

    FANTASY_EVENTS.push({
        id: `f${i}`,
        text: scn.text(cre, item),
        iconUrl: '', // Will be set in generateNewEvent
        choices: [
            {
                text: `${scn.choicePos} (${baseCost} мон.)`,
                cost: baseCost,
                outcomes: isHighRisk ? [
                    { text: 'Неймовірна удача! Ви знайшли в цьому набагато більше, ніж очікували.', reward: 5, probability: 0.15 },
                    { text: 'Це була пастка. Вас пограбували посеред білого дня.', reward: -5, probability: 0.45 },
                    { text: 'Ви отримали предмет, але він виявився підробкою.', reward: 2, probability: 0.4 }
                ] : [
                    { text: 'Вдала угода. Ви отримали прибуток.', reward: 5, probability: 0.4 },
                    { text: 'Це було марнування часу, ви ледь повернули своє.', reward: baseCost, probability: 0.4 },
                    { text: 'Вас трохи надурили на решті.', reward: -2, probability: 0.2 }
                ]
            },
            {
                text: scn.choiceNeg,
                cost: 0,
                outcomes: [
                    {
                        text: Math.random() > 0.5 ? 'Ви зберегли свої монети, хоча відчуття втраченої можливості залишилось.' : 'Спокійний шлях — найкращий шлях.',
                        reward: 0,
                        probability: 1.0
                    }
                ]
            }
        ]
    });
}

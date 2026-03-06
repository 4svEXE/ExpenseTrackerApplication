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

    activeAchievement = signal<{ text: string, reward: number, completed: boolean } | null>(null);

    private readonly STORAGE_KEY = 'gamification_state_v2';

    constructor() {
        this.loadState();

        if (!this.currentEvent() && !this.eventResult() && Date.now() >= this.nextEventTime()) {
            this.generateNewEvent();
        }

        setInterval(() => {
            if (Date.now() >= this.nextEventTime() && !this.currentEvent() && !this.eventResult()) {
                this.generateNewEvent();
            }
            this.checkAchievements();
        }, 60000);

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
            this.nextEventTime.set(state.nextEventTime);
            this.activeAchievement.set(state.activeAchievement);
        }
    }

    private saveState() {
        const state = {
            currentEvent: this.currentEvent(),
            eventResult: this.eventResult(),
            nextEventTime: this.nextEventTime(),
            activeAchievement: this.activeAchievement()
        };
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
    }

    generateNewEvent() {
        if (!this.financeData.userSettings().eventsEnabled) return;

        const event = FANTASY_EVENTS[Math.floor(Math.random() * FANTASY_EVENTS.length)];
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

        // Deduct cost
        if (choice.cost > 0) {
            this.financeData.addCoins(-choice.cost);
        }

        // Determine outcome
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

        // Apply reward
        this.financeData.addCoins(selectedOutcome.reward);

        // Sound effects for outcomes
        if (selectedOutcome.reward > 0) {
            this.audio.playIncome();
        } else if (selectedOutcome.reward < 0) {
            this.audio.playOutcome();
        } else {
            // Neutral outcome sound? Maybe just a subtle click or nothing
        }

        this.eventResult.set({
            text: selectedOutcome.text,
            reward: selectedOutcome.reward
        });
        this.currentEvent.set(null);
    }

    finishEvent() {
        this.eventResult.set(null);
    }

    skipTime() {
        if (this.financeData.userSettings().coins! >= 10) {
            this.financeData.addCoins(-10);
            this.generateNewEvent();
        }
    }

    claimAchievement() {
        const achiev = this.activeAchievement();
        if (achiev && achiev.completed) {
            this.financeData.addCoins(achiev.reward);
            this.audio.playChallengeComplete();
            this.activeAchievement.set(null);
            this.checkAchievements();
        }
    }

    private checkAchievements() {
        if (!this.activeAchievement()) {
            const pool = [
                { text: 'Накопичити 200 монет', reward: 100, check: () => this.financeData.userSettings().coins! >= 200 },
                { text: 'Зробити 3 вибори в подіях', reward: 30, check: () => true },
                { text: 'Виграти золото у дракона', reward: 50, check: () => false }
            ];
            const selected = pool[Math.floor(Math.random() * pool.length)];
            this.activeAchievement.set({ ...selected, completed: selected.check() });
        } else {
            const achiev = this.activeAchievement()!;
            if (!achiev.completed) {
                // Re-check logic if needed
            }
        }
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

const FANTASY_EVENTS: GameEvent[] = [
    {
        id: 'f1',
        text: 'Старий маг пропонує вам випити зілля невідомого кольору. Це може бути еліксир багатства або просто прострочений сік.',
        choices: [
            {
                text: 'Випити (3 монети)',
                cost: 3,
                outcomes: [
                    { text: 'Ваші кишені наповнилися золотом! Ви відчуваєте прилив сил.', reward: 25, probability: 0.3 },
                    { text: 'Це було звичайне молоко, але кумедно пахло.', reward: 0, probability: 0.4 },
                    { text: 'Ой... здається зілля було зіпсоване. Ви втратили трохи монет, поки бігли до кущів.', reward: -10, probability: 0.3 }
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
        choices: [
            {
                text: 'Спробувати забрати',
                cost: 0,
                outcomes: [
                    { text: 'Ви тихо забрали злиток! Дракон навіть не ворухнувся.', reward: 50, probability: 0.2 },
                    { text: 'Дракон чхнув вогнем! Ви ледь встигли відскочити, але край гаманця підгорів.', reward: -20, probability: 0.8 }
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
        choiceNeg: 'Відмовитись'
    },
    {
        text: (c: string, i: string) => `${c} кличе вас зіграти в кості на ${i}. Ризик — благородна справа?`,
        choicePos: 'Грати',
        choiceNeg: 'Відмовитись'
    },
    {
        text: (c: string, i: string) => `Ви бачите, як ${c} впустив ${i} у багнюку. Що зробите?`,
        choicePos: 'Підняти собі',
        choiceNeg: 'Ігнорувати'
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
    const baseCost = Math.floor(Math.random() * 15) + 3;
    const isHighRisk = Math.random() > 0.7;

    FANTASY_EVENTS.push({
        id: `f${i}`,
        text: scn.text(cre, item),
        choices: [
            {
                text: `${scn.choicePos} (${baseCost} мон.)`,
                cost: baseCost,
                outcomes: isHighRisk ? [
                    { text: 'Неймовірна удача! Ви знайшли в цьому набагато більше, ніж очікували.', reward: baseCost * 5, probability: 0.15 },
                    { text: 'Це була пастка. Вас пограбували посеред білого дня.', reward: -baseCost * 2, probability: 0.45 },
                    { text: 'Ви отримали предмет, але він виявився підробкою.', reward: Math.floor(baseCost / 2), probability: 0.4 }
                ] : [
                    { text: 'Вдала угода. Ви отримали прибуток.', reward: Math.floor(baseCost * 2.5), probability: 0.4 },
                    { text: 'Це було марнування часу, ви ледь повернули своє.', reward: baseCost, probability: 0.4 },
                    { text: 'Вас трохи надурили на решті.', reward: -Math.floor(baseCost / 3), probability: 0.2 }
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

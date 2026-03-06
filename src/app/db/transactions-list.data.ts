// Mock data for transactions
// Updated to use larger, diverse values for better chart visualization
const now = new Date();
const currentMonth = now.getMonth();
const currentYear = now.getFullYear();

function getPastDate(monthsAgo: number, day: number) {
  const d = new Date(currentYear, currentMonth - monthsAgo, day);
  return d.toISOString().split('T')[0];
}

export const Transactions = [
  // ПОВТОРИТИ СТРУКТУРУ З ВЕЛИКИМИ ЧИСЛАМИ

  // currentMonth
  { date: getPastDate(0, 5), description: 'Основна зарплата', amount: 9500, category: 'Зарплата', transactionType: 'income' },
  { date: getPastDate(0, 7), description: 'Фріланс проект', amount: 15000, category: 'Фріланс', transactionType: 'income' },
  { date: getPastDate(0, 10), description: 'Оренда офісу', amount: 20000, category: 'Оренда', transactionType: 'expense' },
  { date: getPastDate(0, 15), description: 'Супермаркет', amount: 8000, category: 'Їжа', transactionType: 'expense' },

  // currentMonth - 1
  { date: getPastDate(1, 5), description: 'Зарплата за лютий', amount: 8800, category: 'Зарплата', transactionType: 'income' },
  { date: getPastDate(1, 20), description: 'Ремонт авто', amount: 25000, category: 'Транспорт', transactionType: 'expense' },
  { date: getPastDate(1, 22), description: 'Вечеря', amount: 3000, category: 'Їжа', transactionType: 'expense' },

  // currentMonth - 2
  { date: getPastDate(2, 5), description: 'Зарплата за січень', amount: 8500, category: 'Зарплата', transactionType: 'income' },
  { date: getPastDate(2, 10), description: 'Подарунки до свят', amount: 15000, category: 'Розваги', transactionType: 'expense' },
  { date: getPastDate(2, 18), description: 'Комуналка', amount: 4500, category: 'Комуналка', transactionType: 'expense' },

  // currentMonth - 3
  { date: getPastDate(3, 5), description: 'Зарплата за грудень', amount: 8500, category: 'Зарплата', transactionType: 'income' },
  { date: getPastDate(3, 25), description: 'Новорічний бонус', amount: 5000, category: 'Бонус', transactionType: 'income' },
  { date: getPastDate(3, 20), description: 'Велике замовлення', amount: 3000, category: 'Їжа', transactionType: 'expense' },

  // currentMonth - 4
  { date: getPastDate(4, 5), description: 'Зарплата за листопад', amount: 8000, category: 'Зарплата', transactionType: 'income' },
  { date: getPastDate(4, 12), description: 'Курси англійської', amount: 12000, category: 'Освіта', transactionType: 'expense' },

  // currentMonth - 5
  { date: getPastDate(5, 5), description: 'Зарплата за жовтень', amount: 8000, category: 'Зарплата', transactionType: 'income' },
  { date: getPastDate(5, 10), description: 'Страхування', amount: 10000, category: 'Страхування', transactionType: 'expense' }
];

export interface Category {
  name: string;
  icon: string;
  transactionType: 'income' | 'expense';
  color?: string;
}

export const Categories: Category[] = [
  {
    name: 'Зарплата',
    icon: 'fa-solid fa-money-bill-wave',
    transactionType: 'income',
    color: '#10b981'
  },
  {
    name: 'Бонус',
    icon: 'fa-solid fa-gift',
    transactionType: 'income',
    color: '#f59e0b'
  },
  {
    name: 'Інвестиції',
    icon: 'fa-solid fa-chart-line',
    transactionType: 'income',
    color: '#6366f1'
  },
  {
    name: 'Оренда (дохід)',
    icon: 'fa-solid fa-house-chimney-user',
    transactionType: 'income',
    color: '#2dd4bf'
  },
  {
    name: 'Фриланс',
    icon: 'fa-solid fa-laptop-code',
    transactionType: 'income',
    color: '#8b5cf6'
  },
  {
    name: 'Продукти',
    icon: 'fa-solid fa-cart-shopping',
    transactionType: 'expense',
    color: '#f43f5e'
  },
  {
    name: 'Оренда (витрати)',
    icon: 'fa-solid fa-house-chimney',
    transactionType: 'expense',
    color: '#ef4444'
  },
  {
    name: 'Розваги',
    icon: 'fa-solid fa-mask',
    transactionType: 'expense',
    color: '#d946ef'
  },
  {
    name: 'Комунальні',
    icon: 'fa-solid fa-bolt',
    transactionType: 'expense',
    color: '#0ea5e9'
  },
  {
    name: 'Транспорт',
    icon: 'fa-solid fa-car',
    transactionType: 'expense',
    color: '#f97316'
  },
];

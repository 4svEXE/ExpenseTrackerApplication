import { BehaviorSubject } from 'rxjs';
import { Transaction } from '../types/Transaction';
import { TransactionService } from './transaction.service';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AmountService {
  private amountsSubject = new BehaviorSubject<Amounts>(mocAmounts);

  transactions: Transaction[] = [];

  constructor(private transactionService: TransactionService) {
    // Підписка на потік транзакцій
    this.transactionService.transactions$.subscribe((transactions) => {
      this.transactions = transactions;
      this.updateAmounts(); // Оновлюємо суми, коли змінюються транзакції
    });
  }

  /**
   * Метод для обчислення загальної суми транзакцій
   */
  getTotalAmount(): number {
    return this.transactions.reduce((total, transaction) => {
      return total + transaction.amount;
    }, 0);
  }

  /**
   * Метод для обчислення загального доходу
   */
  getTotalIncome(): number {
    return this.transactions
      .filter((transaction) => transaction.transactionType === 'income')
      .reduce((total, transaction) => total + transaction.amount, 0);
  }

  /**
   * Метод для обчислення загальних витрат
   */
  getTotalExpense(): number {
    return this.transactions
      .filter((transaction) => transaction.transactionType === 'expense')
      .reduce((total, transaction) => total + transaction.amount, 0);
  }

  /**
   * Метод для оновлення стану amountsSubject
   */
  private updateAmounts() {
    const totalIncome = this.getTotalIncome();
    const totalExpense = this.getTotalExpense();
    const totalAmount = totalIncome - totalExpense;

    this.amountsSubject.next({
      totalAmount,
      totalIncome,
      totalExpense,
    });
  }

  /**
   * Потік для спостереження за змінами сум
   */
  get amount$() {
    return this.amountsSubject.asObservable();
  }
}

const mocAmounts = {
  totalAmount: 0,
  totalIncome: 0,
  totalExpense: 0,
};

type Amounts = typeof mocAmounts;

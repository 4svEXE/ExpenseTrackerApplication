import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { LocalStorageService } from './local-storage.service';
import { Transaction } from '../types/Transaction';
import { Transactions } from '../db/Transactions';
import { TransactionType } from '../types/TransactionType';

@Injectable({
  providedIn: 'root',
})
export class TransactionService {
  private readonly StorageKey = 'Transactions';
  private transactionsSubject: BehaviorSubject<Transaction[]> =
    new BehaviorSubject<Transaction[]>([]);
  private transactionSubject = new BehaviorSubject<Transaction>({
    amount: 0,
    category: '',
    date: '',
    description: '',
    transactionType: 'income',
  });

  constructor(private localStorageService: LocalStorageService) {
    // Ініціалізація транзакцій при створенні сервісу
    const initialTransactions = this.getTransactions();
    this.transactionsSubject.next(initialTransactions);
  }

  getTransactions(): Transaction[] {
    const storedTransactions = this.localStorageService.get(this.StorageKey);
    if (storedTransactions) {
      return storedTransactions;
    }

    return this.initTransactions();
  }

  setTransactionsByType(type: TransactionType | '' ): void {
    this.initTransactions();

    if (type === '') {
      this.transactionsSubject.next(this.getTransactions());
      return;
    }

    const transactions = this.transactionsSubject.value;
    const filteredTransactions = transactions.filter(
      (transaction) => transaction.transactionType === type
    );
    this.transactionsSubject.next(filteredTransactions);
  }

  setTransactionByCategory(category: string): void {
    this.initTransactions();

    if (category === '') {
      this.transactionsSubject.next(this.getTransactions());
      return;
    }

    const transactions = this.transactionsSubject.value;
    const filteredTransactions = transactions.filter(
      (transaction) => transaction.category === category
    );
    this.transactionsSubject.next(filteredTransactions);
  }

  getTansactionsByCategory(category: string): Transaction[] {
    const transactions = this.transactionsSubject.value;
    return transactions.filter(
      (transaction) => transaction.category === category
    );
  }

  initTransactions(): Transaction[] {
    const transactions: Transaction[] = Transactions as Transaction[];

    this.localStorageService.set(this.StorageKey, transactions);
    this.transactionsSubject.next(transactions);
    return transactions;
  }

  // Повертає Observable для підписки на зміни в транзакціях
  get transactions$(): Observable<Transaction[]> {
    return this.transactionsSubject.asObservable();
  }

  // Метод для додавання нової транзакції
  addTransaction(newTransaction: Transaction): void {
    const currentTransactions = this.transactionsSubject.value;
    const updatedTransactions = [...currentTransactions, newTransaction];

    console.log(
      'addTransaction, currentTransactions :>> ',
      currentTransactions
    );

    this.localStorageService.set(this.StorageKey, updatedTransactions);
    this.transactionsSubject.next(updatedTransactions);
  }

  // Метод для видалення транзакції за індексом
  deleteTransaction(index: number): void {
    const currentTransactions = this.transactionsSubject.value;
    const updatedTransactions = currentTransactions.filter(
      (_, i) => i !== index
    );
    this.localStorageService.set(this.StorageKey, updatedTransactions);
    this.transactionsSubject.next(updatedTransactions);
  }

  // Методи суб'єкту транзакції

  setTransaction(transaction: Transaction): void {
    this.transactionSubject.next(transaction);
  }

  get transaction$() {
    return this.transactionSubject.asObservable();
  }

  get currentTransaction(): Transaction {
    return this.transactionSubject.value;
  }
}

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { LocalStorageService } from './local-storage.service';
import { Transaction } from '../types/Transaction';
import { Transactions } from '../db/Transactions';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private readonly StorageKey = 'Transactions';
  private transactionsSubject: BehaviorSubject<Transaction[]> = new BehaviorSubject<Transaction[]>([]);
  private transactionSubject = new BehaviorSubject<Transaction >(
    {
      amount: 0,
      category: '',
      date: '',
      description: '',
      transactionType: 'income',
    }
  );


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
    this.localStorageService.set(this.StorageKey, updatedTransactions);
    this.transactionsSubject.next(updatedTransactions);
  }

  // Метод для видалення транзакції за індексом
  deleteTransaction(index: number): void {
    const currentTransactions = this.transactionsSubject.value;
    const updatedTransactions = currentTransactions.filter((_, i) => i !== index);
    this.localStorageService.set(this.StorageKey, updatedTransactions);
    this.transactionsSubject.next(updatedTransactions);
  }


  // Метод для отримання суб'єкту транзакції

  setTransaction(transaction: Transaction): void {
    this.transactionSubject.next(transaction);
    this.addTransaction(transaction);
  }

  get transaction$() {
    return this.transactionSubject.asObservable();
  }

  get currentTransaction(): Transaction {
    return this.transactionSubject.value;
  }
}

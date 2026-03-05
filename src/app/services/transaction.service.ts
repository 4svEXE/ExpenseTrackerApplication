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
  private transactionsSubject = new BehaviorSubject<Transaction[]>([]);
  private allTransactionsSubject = new BehaviorSubject<Transaction[]>([]);
  private currentViewDateSubject = new BehaviorSubject<Date>(new Date());
  private transactionSubject = new BehaviorSubject<Transaction>({
    amount: 0,
    category: '',
    date: '',
    description: '',
    transactionType: (localStorage.getItem('lastTransactionType') as TransactionType) || 'income',
  });

  constructor(private localStorageService: LocalStorageService) {
    const initialTransactions = this.getTransactions();
    this.allTransactionsSubject.next(initialTransactions);
    this.applyFilters(initialTransactions, this.currentViewDateSubject.value);
  }

  get currentViewDate$() {
    return this.currentViewDateSubject.asObservable();
  }

  get allTransactions$(): Observable<Transaction[]> {
    return this.allTransactionsSubject.asObservable();
  }

  setCurrentViewDate(date: Date) {
    this.currentViewDateSubject.next(date);
    this.applyFilters(this.getTransactions(), date);
  }

  private applyFilters(allTransactions: Transaction[], viewDate: Date) {
    this.allTransactionsSubject.next(allTransactions);
    const filtered = allTransactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === viewDate.getMonth() && d.getFullYear() === viewDate.getFullYear();
    });
    this.transactionsSubject.next(this.sortByDate(filtered));
  }

  getTransactions(): Transaction[] {
    try {
      const storedTransactions = this.localStorageService.get(this.StorageKey);
      return storedTransactions || [];
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return []
    }
  }

  setTransactions(transactions: Transaction[]): void {
    this.transactionsSubject.next(transactions);
  }

  sortByDate(transactions: Transaction[], byLatest = true): Transaction[] {
    return [...transactions].sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);

      if (byLatest) {
        return dateB.getTime() - dateA.getTime();
      }
      return dateA.getTime() - dateB.getTime();
    });
  }

  setTransactionsByType(type: TransactionType | ''): void {
    const transactions = this.getTransactions();

    if (type === '') {
      this.applyFilters(transactions, this.currentViewDateSubject.value);
      return;
    }

    const filteredTransactions = transactions.filter(
      (transaction) => transaction.transactionType === type
    );
    this.transactionsSubject.next(filteredTransactions);
  }

  setTransactionByCategory(category: string): void {
    const transactions = this.getTransactions();

    if (category === '') {
      this.applyFilters(transactions, this.currentViewDateSubject.value);
      return;
    }

    const filteredTransactions = transactions.filter(
      (transaction) => transaction.category === category
    );
    this.transactionsSubject.next(filteredTransactions);
  }

  getTansactionsByCategory(category: string): Transaction[] {
    const transactions = this.getTransactions();
    return transactions.filter(
      (transaction) => transaction.category === category
    );
  }

  initTransactions(): Transaction[] {
    const transactions: Transaction[] = Transactions as Transaction[];
    this.localStorageService.set(this.StorageKey, transactions);
    this.allTransactionsSubject.next(transactions);
    this.applyFilters(transactions, this.currentViewDateSubject.value);
    return transactions;
  }

  get transactions$(): Observable<Transaction[]> {
    return this.transactionsSubject.asObservable();
  }

  addTransaction(newTransaction: Transaction): void {
    const allStored = this.getTransactions();
    const updated = this.sortByDate([...allStored, newTransaction]);
    this.localStorageService.set(this.StorageKey, updated);
    this.applyFilters(updated, this.currentViewDateSubject.value);
  }

  deleteTransaction(transaction: Transaction): void {
    const allStored = this.getTransactions();
    const updated = allStored.filter(item =>
      !(item.date === transaction.date &&
        item.amount === transaction.amount &&
        item.category === transaction.category &&
        item.description === transaction.description)
    );
    this.localStorageService.set(this.StorageKey, updated);
    this.applyFilters(updated, this.currentViewDateSubject.value);
  }

  setTransaction(transaction: Transaction): void {
    if (transaction.transactionType) {
      localStorage.setItem('lastTransactionType', transaction.transactionType);
    }
    this.transactionSubject.next(transaction);
  }

  get transaction$() {
    return this.transactionSubject.asObservable();
  }

  get currentTransaction(): Transaction {
    return this.transactionSubject.value;
  }
}

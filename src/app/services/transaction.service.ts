import { Injectable, signal, computed } from '@angular/core';
import { LocalStorageService } from './local-storage.service';
import { Transaction } from '../types/transaction.interface';
import { Transactions } from '../db/transactions-list.data';
import { TransactionType } from '../types/transaction-type.enum';

@Injectable({
  providedIn: 'root',
})
export class TransactionService {
  private readonly StorageKey = 'Transactions';
  transactions = signal<Transaction[]>([]);
  allTransactions = signal<Transaction[]>([]);
  currentViewDate = signal<Date>(new Date());
  transaction = signal<Transaction>({
    amount: 0,
    currency: '',
    category: '',
    date: '',
    description: '',
    transactionType: (localStorage.getItem('lastTransactionType') as TransactionType) || 'income',
  });

  constructor(private localStorageService: LocalStorageService) {
    const initialTransactions = this.getTransactions();
    this.allTransactions.set(initialTransactions);
    this.applyFilters(initialTransactions, this.currentViewDate());
  }

  setCurrentViewDate(date: Date) {
    this.currentViewDate.set(date);
    this.applyFilters(this.getTransactions(), date);
  }

  private applyFilters(allTransactions: Transaction[], viewDate: Date) {
    this.allTransactions.set(allTransactions);
    const filtered = allTransactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === viewDate.getMonth() && d.getFullYear() === viewDate.getFullYear();
    });
    this.transactions.set(this.sortByDate(filtered));
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
    this.transactions.set(transactions);
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
      this.applyFilters(transactions, this.currentViewDate());
      return;
    }

    const filteredTransactions = transactions.filter(
      (transaction) => transaction.transactionType === type
    );
    this.transactions.set(filteredTransactions);
  }

  setTransactionByCategory(category: string): void {
    const transactions = this.getTransactions();

    if (category === '') {
      this.applyFilters(transactions, this.currentViewDate());
      return;
    }

    const filteredTransactions = transactions.filter(
      (transaction) => transaction.category === category
    );
    this.transactions.set(filteredTransactions);
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
    this.allTransactions.set(transactions);
    this.applyFilters(transactions, this.currentViewDate());
    return transactions;
  }

  addTransaction(newTransaction: Transaction): void {
    if (!newTransaction.id) {
      newTransaction.id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    }
    const allStored = this.getTransactions();
    const updated = this.sortByDate([...allStored, newTransaction]);
    this.localStorageService.set(this.StorageKey, updated);
    this.applyFilters(updated, this.currentViewDate());
  }

  deleteTransaction(transaction: Transaction): void {
    const allStored = this.getTransactions();
    const updated = allStored.filter(item => {
      if (item.id && transaction.id) {
        return item.id !== transaction.id;
      }
      return !(item.date === transaction.date &&
        item.amount === transaction.amount &&
        item.category === transaction.category &&
        item.description === transaction.description);
    });
    this.localStorageService.set(this.StorageKey, updated);
    this.applyFilters(updated, this.currentViewDate());
  }

  setTransaction(transaction: Transaction): void {
    if (transaction.transactionType) {
      localStorage.setItem('lastTransactionType', transaction.transactionType);
    }
    this.transaction.set(transaction);
  }

  get currentTransaction(): Transaction {
    return this.transaction();
  }
}

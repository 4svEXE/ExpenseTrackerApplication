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
    this.applyFilters(this.allTransactions(), date);
  }

  private applyFilters(allTransactions: Transaction[], viewDate: Date) {
    this.allTransactions.set(allTransactions);
    const viewMonth = viewDate.getMonth() + 1; // 1-12
    const viewYear = viewDate.getFullYear();
    const viewMonthStr = viewMonth.toString().padStart(2, '0');
    const viewYearStr = viewYear.toString();
    const datePrefix = `${viewYearStr}-${viewMonthStr}`;

    const filtered = allTransactions.filter(t => {
      if (t.date.startsWith(datePrefix)) return true;
      // Fallback for non-ISO or differently formatted dates
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
    const parsed = transactions.map(t => {
      // Try fast parsing for ISO string if possible, otherwise use Date
      let time = 0;
      if (t.date && t.date.length >= 10 && t.date[4] === '-' && t.date[7] === '-') {
        // Assume ISO-like format string comparison is mostly correct, but we need time for sorting
        time = new Date(t.date).getTime();
      } else {
        time = new Date(t.date).getTime();
      }
      return { t, time };
    });

    parsed.sort((a, b) => {
      if (byLatest) {
        return b.time - a.time;
      }
      return a.time - b.time;
    });

    return parsed.map(p => p.t);
  }

  setTransactionsByType(type: TransactionType | ''): void {
    const transactions = this.allTransactions();

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
    const transactions = this.allTransactions();

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
    const transactions = this.allTransactions();
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
    const allStored = this.allTransactions();
    const updated = this.sortByDate([...allStored, newTransaction]);
    this.localStorageService.set(this.StorageKey, updated);
    this.applyFilters(updated, this.currentViewDate());
  }

  deleteTransaction(transaction: Transaction): void {
    const allStored = this.allTransactions();
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
    // Create a copy to avoid side effects
    this.transaction.set({ ...transaction });
  }

  updateTransaction(updatedTransaction: Transaction): void {
    const allStored = [...this.allTransactions()]; // shallow copy
    const index = allStored.findIndex(item => item.id === updatedTransaction.id);
    
    if (index !== -1) {
      allStored[index] = updatedTransaction;
      this.localStorageService.set(this.StorageKey, allStored);
      this.applyFilters(allStored, this.currentViewDate());
    } else {
      // Fallback to add if not found (shouldn't happen with IDs)
      this.addTransaction(updatedTransaction);
    }
  }

  get currentTransaction(): Transaction {
    return this.transaction();
  }
}

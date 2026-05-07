import { Component, effect, inject } from '@angular/core';
import { TransactionService } from '../../services/transaction.service';
import { Transaction } from '../../types/transaction.interface';
import { TransactionItemComponent } from '../transaction-item/transaction-item.component';
import { CommonModule } from '@angular/common';
import { FinanceDataService } from '../../services/finance-data.service';

interface GroupedTransactions {
  date: Date;
  dailyBalance: number;
  items: Transaction[];
}

@Component({
  selector: 'app-transaction-list',
  imports: [TransactionItemComponent, CommonModule],
  templateUrl: './transaction-list.component.html',
  styleUrls: ['./transaction-list.component.scss']
})
export class TransactionListComponent {
  groupedTransactions: GroupedTransactions[] = [];
  financeData = inject(FinanceDataService);

  constructor(private transactionService: TransactionService) {
    effect(() => {
      const data = this.transactionService.transactions();
      this.groupedTransactions = this.groupTransactionsByDate(data);
    });
  }

  private groupTransactionsByDate(transactions: Transaction[]): GroupedTransactions[] {
    const groups: { [key: string]: GroupedTransactions } = {};
    const userCurrency = this.financeData.userSettings().currency;
    const accounts = this.financeData.accounts();
    
    // Fast lookup for accounts to avoid O(N^2)
    const accMap = new Map();
    for (const a of accounts) {
      accMap.set(a.id, a);
    }

    transactions.forEach(t => {
      if (!t.date) return;
      
      // Fast date extraction if it's already an ISO string
      let dateKey = '';
      let parsedDate: Date;
      if (typeof t.date === 'string' && t.date.length >= 10 && t.date[4] === '-' && t.date[7] === '-') {
        dateKey = t.date.substring(0, 10);
        const [y, m, d] = dateKey.split('-');
        parsedDate = new Date(+y, +m - 1, +d);
      } else {
        parsedDate = new Date(t.date);
        dateKey = parsedDate.toISOString().split('T')[0];
      }

      if (!groups[dateKey]) {
        groups[dateKey] = {
          date: parsedDate,
          dailyBalance: 0,
          items: []
        };
      }
      groups[dateKey].items.push(t);

      // Determine transaction currency
      let txCurrency = 'UAH';
      if (t.accountId) {
        const acc = accMap.get(t.accountId);
        if (acc) txCurrency = acc.currency;
      }

      // Convert amount to user currency for the balance calculation
      let amountInUserCurrency = t.amount;
      if (txCurrency !== userCurrency) {
        amountInUserCurrency = t.amount * this.financeData.getExchangeRate(txCurrency, userCurrency);
      }

      if (t.transactionType === 'income') {
        groups[dateKey].dailyBalance += amountInUserCurrency;
      } else {
        groups[dateKey].dailyBalance -= amountInUserCurrency;
      }
    });

    return Object.values(groups).sort((a, b) => b.date.getTime() - a.date.getTime());
  }
}

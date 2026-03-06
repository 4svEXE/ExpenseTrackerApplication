import { Component, OnInit, inject } from '@angular/core';
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
export class TransactionListComponent implements OnInit {
  groupedTransactions: GroupedTransactions[] = [];
  financeData = inject(FinanceDataService);

  constructor(private transactionService: TransactionService) { }

  ngOnInit(): void {
    this.transactionService.transactions$.subscribe((data) => {
      this.groupedTransactions = this.groupTransactionsByDate(data);
    });
  }

  private groupTransactionsByDate(transactions: Transaction[]): GroupedTransactions[] {
    const groups: { [key: string]: GroupedTransactions } = {};
    const userCurrency = this.financeData.userSettings().currency;
    const accounts = this.financeData.accounts();

    transactions.forEach(t => {
      if (!t.date) return;
      const dateKey = new Date(t.date).toISOString().split('T')[0];
      if (!groups[dateKey]) {
        groups[dateKey] = {
          date: new Date(t.date),
          dailyBalance: 0,
          items: []
        };
      }
      groups[dateKey].items.push(t);

      // Determine transaction currency
      let txCurrency = 'UAH';
      if (t.accountId) {
        const acc = accounts.find(a => a.id === t.accountId);
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

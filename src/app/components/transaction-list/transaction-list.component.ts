import { Component, OnInit } from '@angular/core';
import { TransactionService } from '../../services/transaction.service';
import { Transaction } from '../../types/transaction';
import { TransactionItemComponent } from '../transaction-item/transaction-item.component';
import { CommonModule } from '@angular/common';

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

  constructor(private transactionService: TransactionService) { }

  ngOnInit(): void {
    this.transactionService.transactions$.subscribe((data) => {
      this.groupedTransactions = this.groupTransactionsByDate(data);
    });
  }

  private groupTransactionsByDate(transactions: Transaction[]): GroupedTransactions[] {
    const groups: { [key: string]: GroupedTransactions } = {};

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
      if (t.transactionType === 'income') {
        groups[dateKey].dailyBalance += t.amount;
      } else {
        groups[dateKey].dailyBalance -= t.amount;
      }
    });

    return Object.values(groups).sort((a, b) => b.date.getTime() - a.date.getTime());
  }
}

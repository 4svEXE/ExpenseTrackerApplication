import { Component, OnInit } from '@angular/core';
import { TransactionService } from '../../services/transaction.service';
import { Transaction } from '../../types/Transaction';
import { TransactionItemComponent } from '../transaction-item/transaction-item.component';

@Component({
  selector: 'app-transaction-list',
  imports: [TransactionItemComponent],
  templateUrl: './transaction-list.component.html',
  styleUrls: ['./transaction-list.component.scss']
})
export class TransactionListComponent implements OnInit {
  transactions: Transaction[] = [];

  constructor(private transactionService: TransactionService) {}

  ngOnInit(): void {
    this.transactionService.transactions$.subscribe((data) => {
      this.transactions = data;
    });
  }
}

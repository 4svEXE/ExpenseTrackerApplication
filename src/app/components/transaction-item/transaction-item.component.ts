import { Component, Input } from '@angular/core';
import { Transaction } from '../../types/Transaction';
import { CommonModule } from '@angular/common';
import { TransactionService } from '../../services/transaction.service';

@Component({
  selector: 'app-transaction-item',
  imports: [CommonModule],
  templateUrl: './transaction-item.component.html',
  styleUrl: './transaction-item.component.scss',
})
export class TransactionItemComponent {
  @Input() item!: Transaction;

  constructor(private transactionService: TransactionService) {}

  onDelete(){
    this.transactionService.deleteTransaction(this.item);
  }
}

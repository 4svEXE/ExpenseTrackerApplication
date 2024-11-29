import { Component, Input } from '@angular/core';
import { Transaction } from '../../types/Transaction';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-transaction-item',
  imports: [CommonModule],
  templateUrl: './transaction-item.component.html',
  styleUrl: './transaction-item.component.scss',
})
export class TransactionItemComponent {
  @Input() item!: Transaction;
}

import { Component } from '@angular/core';
import { TransactionType } from '../../../../types/TransactionType';
import { TransactionService } from '../../../../services/transaction.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-filter-by-type',
  imports: [CommonModule],
  templateUrl: './filter-by-type.component.html',
  styleUrl: './filter-by-type.component.scss',
})
export class FilterByTypeComponent {
  transactionType: TransactionType | '' = '';
  transactionTypes: TransactionTypeOption[] = types as TransactionTypeOption[];

  getLabel() {
    return this.transactionTypes.find(t => t.value === this.transactionType)?.label || this.transactionType;
  }

  constructor(private transactionService: TransactionService) { }

  onTypeChange(event: any): void {
    this.transactionType = event.target.value;
    this.transactionService.setTransactionsByType(this.transactionType);

    // this.categories = this.categoryService.getCategoryByType(
    //   this.transactionType
    // );
  }

  resetSelectedType() {
    this.transactionType = '';
    this.transactionService.setTransactionsByType('');
  }
}

type TransactionTypeOption = { value: TransactionType | ''; label: string };

const types = [
  { value: '', label: 'Всі' },
  { value: 'income', label: 'Дохід' },
  { value: 'expense', label: 'Витрати' },
];

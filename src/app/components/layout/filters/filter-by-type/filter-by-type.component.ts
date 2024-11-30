import { Component } from '@angular/core';
import { TransactionType } from '../../../../types/TransactionType';
import { TransactionService } from '../../../../services/transaction.service';

@Component({
  selector: 'app-filter-by-type',
  imports: [],
  templateUrl: './filter-by-type.component.html',
  styleUrl: './filter-by-type.component.scss',
})
export class FilterByTypeComponent {
  transactionType: TransactionType | '' = '';
  transactionTypes: TransactionTypeOption[] = types as TransactionTypeOption[];

  constructor(private transactionService: TransactionService) {}

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
  { value: '', label: 'All' },
  { value: 'income', label: 'Income' },
  { value: 'expense', label: 'Expense' },
];

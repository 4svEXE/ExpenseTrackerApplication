import { CategoryService } from './../../../services/category.service';
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { TransactionType } from '../../../types/TransactionType';
import { TransactionService } from '../../../services/transaction.service';
import { TransactionCategory } from '../../../types/TransactionCategory';

@Component({
  selector: 'app-filters',
  imports: [CommonModule],
  templateUrl: './filters.component.html',
  styleUrl: './filters.component.scss',
})
export class FiltersComponent {
  transactionTypes: TransactionTypeOption[] = [
    { value: '', label: 'All' },
    { value: 'income', label: 'Income' },
    { value: 'expense', label: 'Expense' },
  ];

  categories!: TransactionCategory[];

  transactionType: TransactionType | '' = '';

  constructor(
    private transactionService: TransactionService,
    private categoryService: CategoryService
  ) {}

  ngOnInit() {
    this.categories = this.categoryService.getCategories();
  }

  onTypeChange(event: any): void {
    this.transactionType = event.target.value;
    this.transactionService.setTransactionsByType(this.transactionType);

    this.categories = this.categoryService.getCategoryByType(this.transactionType);
  }

  onCategoryChange(event: any): void {
    const category = event.target.value;
    this.transactionService.setTransactionByCategory(category);
  }
}

type TransactionTypeOption = { value: TransactionType | ''; label: string };

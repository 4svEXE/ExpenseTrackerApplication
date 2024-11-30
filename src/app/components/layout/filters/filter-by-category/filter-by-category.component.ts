import { Component } from '@angular/core';
import { TransactionService } from '../../../../services/transaction.service';
import { TransactionCategory } from '../../../../types/TransactionCategory';
import { CategoryService } from '../../../../services/category.service';

@Component({
  selector: 'app-filter-by-category',
  imports: [],
  templateUrl: './filter-by-category.component.html',
  styleUrl: './filter-by-category.component.scss',
})
export class FilterByCategoryComponent {
  categories!: TransactionCategory[];
  selectedCategory: TransactionCategory | '' = '';

  constructor(
    private transactionService: TransactionService,
    private categoryService: CategoryService
  ) {}

  ngOnInit() {
    this.categories = this.categoryService.getCategories();
  }
  
  onCategoryChange(event: any): void {
    this.selectedCategory = event.target.value as TransactionCategory | '';

    this.transactionService.setTransactionByCategory(event.target.value);
  }

  resetSelectedCategory() {
    this.selectedCategory = '';
    this.transactionService.setTransactionByCategory('');
  }
}

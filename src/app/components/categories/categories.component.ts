import { Component, Input } from '@angular/core';
import { TransactionType } from '../../types/TransactionType';
import { TransactionCategory } from '../../types/TransactionCategory';
import { CategoryService } from '../../services/category.service';

@Component({
  selector: 'app-categories',
  imports: [],
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.scss',
})
export class CategoriesComponent {
  @Input() transactionType: TransactionType = 'income';

  categories: TransactionCategory[] = [];

  constructor(private categoryService: CategoryService) {}

  ngOnInit(): void {
    this.categories = this.categoryService.getCategories();
  }
}

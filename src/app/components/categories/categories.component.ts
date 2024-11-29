import { Transaction } from './../../types/Transaction';
import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TransactionType } from '../../types/TransactionType';
import { TransactionCategory } from '../../types/TransactionCategory';
import { CategoryService } from '../../services/category.service';
import { TransactionService } from '../../services/transaction.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-categories',
  imports: [],
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.scss',
})
export class CategoriesComponent implements OnInit {
  @Input() transactionType: TransactionType = 'income';
  categories: TransactionCategory[] = [];
  transactionSub!: Subscription;
  transaction!: Transaction;

  constructor(
    private route: ActivatedRoute,
    private categoryService: CategoryService,
    private transactionService: TransactionService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const type = params.get('type') as TransactionType;
      if (type === 'income' || type === 'expense') {
        this.transactionType = type;
      }

      this.categories = this.categoryService.getCategoryByType(
        this.transactionType
      );

      this.transactionService.setTransaction({
        ...this.transaction,
        transactionType: type,
        category: '',
      });
    });

    this.transactionSub = this.transactionService.transaction$.subscribe(
      (transaction) => {
        this.transaction = transaction;
      }
    );
  }

  onSelectCategory(category: TransactionCategory) {
    this.transactionService.setTransaction({
      ...this.transaction,
      category: category.name,
    });
  }

  isSelectedCategory(category: TransactionCategory) {
    return this.transaction.category === category.name;
  }
}

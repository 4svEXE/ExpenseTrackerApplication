import { Transaction } from './../../../types/Transaction';
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FilterByTypeComponent } from './filter-by-type/filter-by-type.component';
import { FilterByCategoryComponent } from './filter-by-category/filter-by-category.component';
import { TransactionService } from '../../../services/transaction.service';

@Component({
  selector: 'app-filters',
  imports: [CommonModule, FilterByTypeComponent, FilterByCategoryComponent],
  templateUrl: './filters.component.html',
  styleUrl: './filters.component.scss',
})
export class FiltersComponent {
  isLAtest = true;
  constructor(private transactionService: TransactionService) {}

  sortByDate() {
    this.isLAtest = !this.isLAtest;
    let transactions: Transaction[] = this.transactionService.getTransactions();
    transactions = this.transactionService.sortByDate(transactions, this.isLAtest);

    this.transactionService.setTransactions(transactions);
  }
}

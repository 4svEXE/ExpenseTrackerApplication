import { Transaction } from './../../../types/transaction.interface';
import { CommonModule } from '@angular/common';
import { Component, effect } from '@angular/core';
import { FilterByTypeComponent } from './filter-by-type/filter-by-type.component';
import { FilterByCategoryComponent } from './filter-by-category/filter-by-category.component';
import { TransactionService } from '../../../services/transaction.service';

@Component({
  selector: 'app-filters',
  standalone: true,
  imports: [CommonModule, FilterByTypeComponent, FilterByCategoryComponent],
  templateUrl: './filters.component.html',
  styleUrl: './filters.component.scss',
})
export class FiltersComponent {
  isLAtest = true;
  isFiltersOpen = false;
  currentDate: Date = new Date();

  constructor(private transactionService: TransactionService) {
    effect(() => {
      this.currentDate = this.transactionService.currentViewDate();
    });
  }

  changeMonth(delta: number) {
    const newDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + delta, 1);
    this.transactionService.setCurrentViewDate(newDate);
  }

  toggleFilters() {
    this.isFiltersOpen = !this.isFiltersOpen;
  }

  sortByDate() {
    this.isLAtest = !this.isLAtest;
    let transactions: Transaction[] = this.transactionService.getTransactions();
    transactions = this.transactionService.sortByDate(transactions, this.isLAtest);

    this.transactionService.setTransactions(transactions);
  }
}

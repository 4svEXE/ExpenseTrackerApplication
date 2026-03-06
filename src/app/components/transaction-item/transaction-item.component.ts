import { Component, Input, inject } from '@angular/core';
import { Transaction } from '../../types/transaction.interface';
import { CommonModule } from '@angular/common';
import { TransactionService } from '../../services/transaction.service';
import { CategoryService } from '../../services/category.service';
import { FinanceDataService } from '../../services/finance-data.service';

@Component({
  selector: 'app-transaction-item',
  imports: [CommonModule],
  templateUrl: './transaction-item.component.html',
  styleUrl: './transaction-item.component.scss',
})
export class TransactionItemComponent {
  @Input() item!: Transaction;
  financeData = inject(FinanceDataService);

  showDetails = false;
  isAnimating = false;

  constructor(
    private transactionService: TransactionService,
    private categoryService: CategoryService
  ) { }

  get userCurrency() {
    return this.financeData.userSettings().currency;
  }

  get categoryIcon() {
    const cats = this.categoryService.getCategoryByType(this.item.transactionType);
    const found = cats.find(c => c.name === this.item.category);
    return found ? found.icon : 'fa-solid fa-tag';
  }

  get accountName() {
    const accountId = this.item.accountId;
    if (!accountId) return 'Невідомий рахунок';
    const acct = this.financeData.accounts().find(a => a.id === accountId);
    return acct ? acct.name : 'Невідомий рахунок';
  }

  get transactionCurrency() {
    const accountId = this.item.accountId;
    if (!accountId) return 'UAH';
    const acct = this.financeData.accounts().find(a => a.id === accountId);
    return acct ? acct.currency : 'UAH';
  }

  openDetails() {
    this.showDetails = true;
    this.isAnimating = true;
    setTimeout(() => {
      this.isAnimating = false;
    }, 10);
  }

  closeDetails() {
    this.isAnimating = true;
    setTimeout(() => {
      this.showDetails = false;
      this.isAnimating = false;
    }, 300);
  }

  onDelete(event: Event) {
    event.stopPropagation();
    if (confirm('Видалити транзакцію?')) {
      this.transactionService.deleteTransaction(this.item);
      this.closeDetails();
    }
  }
}

import { Component, Input, inject } from '@angular/core';
import { Transaction } from '../../types/transaction.interface';
import { CommonModule } from '@angular/common';
import { TransactionService } from '../../services/transaction.service';
import { CategoryService } from '../../services/category.service';
import { FinanceDataService } from '../../services/finance-data.service';
import { ConfirmService } from '../../services/confirm.service';

@Component({
  selector: 'app-transaction-item',
  imports: [CommonModule],
  templateUrl: './transaction-item.component.html',
  styleUrl: './transaction-item.component.scss',
})
export class TransactionItemComponent {
  @Input() item!: Transaction;
  financeData = inject(FinanceDataService);
  confirmService = inject(ConfirmService);

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
    if (this.item.currency) return this.item.currency;
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

  onEdit(event: Event) {
    event.stopPropagation();
    this.closeDetails();
    this.transactionService.setTransaction(this.item);
  }

  async onDelete(event: Event) {
    event.stopPropagation();
    if (await this.confirmService.confirm('Видалити транзакцію?')) {
      // Reverse the balance impact
      const reverseType = this.item.transactionType === 'income' ? 'expense' : 'income';

      // Use assigned accountId or fallback to first account
      let targetAccountId = this.item.accountId;
      if (!targetAccountId && this.financeData.accounts().length > 0) {
        targetAccountId = this.financeData.accounts()[0].id;
      }

      if (targetAccountId) {
        const targetAccount = this.financeData.accounts().find(a => a.id === targetAccountId);
        let amountToReverse = this.item.amount;
        
        if (targetAccount && this.item.currency && this.item.currency !== targetAccount.currency) {
          amountToReverse = this.item.amount * this.financeData.getExchangeRate(this.item.currency, targetAccount.currency);
        }

        this.financeData.adjustAccountBalance(
          targetAccountId,
          amountToReverse,
          reverseType
        );
      }

      // Restore Debt if it was a debt execution
      if (this.item.debtId && this.item.debtName) {
        const currentDebts = [...this.financeData.debts()];
        const alreadyExists = currentDebts.some(d => d.id === this.item.debtId);
        if (!alreadyExists) {
          currentDebts.unshift({
            id: this.item.debtId,
            name: this.item.debtName,
            amount: this.item.debtAmount || 0
          });
          this.financeData.saveDebts(currentDebts);
        }
      }

      this.transactionService.deleteTransaction(this.item);
      this.closeDetails();
    }
  }
}

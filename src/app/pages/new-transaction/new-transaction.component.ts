import { Component, inject } from '@angular/core';
import { RouterLink, RouterModule } from '@angular/router';
import { CategoriesComponent } from '../../components/categories/categories.component';
import { TransactionInputComponent } from '../../components/layout/transaction-input/transaction-input.component';
import { TransactionService } from '../../services/transaction.service';

@Component({
  selector: 'app-new-transaction',
  imports: [
    RouterLink,
    RouterModule,
    CategoriesComponent,
    TransactionInputComponent,
  ],
  templateUrl: './new-transaction.component.html',
  styleUrl: './new-transaction.component.scss',
})
export class NewTransactionComponent {
  transactionService = inject(TransactionService);

  get isEditMode() {
    return !!this.transactionService.transaction().id;
  }
}

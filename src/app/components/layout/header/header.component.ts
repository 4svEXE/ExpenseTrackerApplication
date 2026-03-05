import { Component, inject } from '@angular/core';
import { AmountService } from '../../../services/amount.service';
import { FinanceDataService } from '../../../services/finance-data.service';
import { map, Observable } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  totalIncome$!: Observable<number>;
  totalExpense$!: Observable<number>;

  financeData = inject(FinanceDataService);

  constructor(private amountService: AmountService) {
    this.totalIncome$ = this.amountService.amount$.pipe(map(amounts => amounts.totalIncome));
    this.totalExpense$ = this.amountService.amount$.pipe(map(amounts => amounts.totalExpense));
  }

  get totalBalance() {
    return this.financeData.totalBalance();
  }

  get userCurrency() {
    return this.financeData.userSettings().currency;
  }
}

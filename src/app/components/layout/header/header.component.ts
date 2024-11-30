import { Component } from '@angular/core';
import { AmountService } from '../../../services/amount.service';
import { map, Observable } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  totalAmount$!: Observable<number>;
  totalIncome$!: Observable<number>;
  totalExpense$!: Observable<number>;

  constructor(private amountService: AmountService) {
    this.totalAmount$ = this.amountService.amount$.pipe(map(amounts => amounts.totalAmount));
    this.totalIncome$ = this.amountService.amount$.pipe(map(amounts => amounts.totalIncome));
    this.totalExpense$ = this.amountService.amount$.pipe(map(amounts => amounts.totalExpense));
  }
}

import { Component } from '@angular/core';
import { TransactionListComponent } from '../../components/transaction-list/transaction-list.component';
import { FiltersComponent } from '../../components/layout/filters/filters.component';

@Component({
  selector: 'app-home',
  imports: [TransactionListComponent, FiltersComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {

}

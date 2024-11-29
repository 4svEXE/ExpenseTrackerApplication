import { Component } from '@angular/core';
import { TransactionListComponent } from '../../components/transaction-list/transaction-list.component';

@Component({
  selector: 'app-home',
  imports: [TransactionListComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {

}

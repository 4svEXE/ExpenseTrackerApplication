import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-nav',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './nav.component.html',
  styleUrl: './nav.component.scss'
})
export class NavComponent {
  private router = inject(Router);

  get transactionLink() {
    const lastType = localStorage.getItem('lastTransactionType') || 'income';
    return `/new-transaction/categories/${lastType}`;
  }
}

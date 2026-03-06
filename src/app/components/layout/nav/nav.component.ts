import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './nav.component.html',
  styleUrl: './nav.component.scss'
})
export class NavComponent {
  private router = inject(Router);
  isExpanded = false;

  toggleMenu(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.isExpanded = !this.isExpanded;
  }

  navigateTo(type: 'income' | 'expense') {
    this.isExpanded = false;
    this.router.navigate(['/new-transaction/categories', type]);
  }

  get transactionLink() {
    const lastType = localStorage.getItem('lastTransactionType') || 'income';
    return `/new-transaction/categories/${lastType}`;
  }
}

import { Component, inject, HostListener, ElementRef } from '@angular/core';
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
  private el = inject(ElementRef);
  isExpanded = false;

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.el.nativeElement.contains(event.target)) {
      this.isExpanded = false;
    }
  }

  toggleMenu(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.isExpanded = !this.isExpanded;

    if (this.isExpanded) {
      // Navigate to new transaction page simultaneously
      const lastType = localStorage.getItem('lastTransactionType') || 'income';
      this.router.navigate(['/new-transaction/categories', lastType]);
    }
  }

  navigateTo(type: 'income' | 'expense') {
    this.isExpanded = false;
    localStorage.setItem('lastTransactionType', type);
    this.router.navigate(['/new-transaction/categories', type]);
  }

  get transactionLink() {
    const lastType = localStorage.getItem('lastTransactionType') || 'income';
    return `/new-transaction/categories/${lastType}`;
  }
}

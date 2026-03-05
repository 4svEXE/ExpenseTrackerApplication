import { Transaction } from './../../types/Transaction';
import { Component, Input, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TransactionType } from '../../types/TransactionType';
import { TransactionCategory } from '../../types/TransactionCategory';
import { CategoryService } from '../../services/category.service';
import { TransactionService } from '../../services/transaction.service';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

const AVAILABLE_ICONS = [
  'fa-solid fa-money-bill-wave', 'fa-solid fa-gift', 'fa-solid fa-chart-line', 'fa-solid fa-house-chimney-user',
  'fa-solid fa-laptop-code', 'fa-solid fa-cart-shopping', 'fa-solid fa-house-chimney', 'fa-solid fa-mask',
  'fa-solid fa-faucet-detergent', 'fa-solid fa-car', 'fa-solid fa-utensils', 'fa-solid fa-coffee',
  'fa-solid fa-film', 'fa-solid fa-gamepad', 'fa-solid fa-dumbbell', 'fa-solid fa-briefcase-medical',
  'fa-solid fa-graduation-cap', 'fa-solid fa-plane', 'fa-solid fa-hotel', 'fa-solid fa-gas-pump',
  'fa-solid fa-bus', 'fa-solid fa-train', 'fa-solid fa-bicycle', 'fa-solid fa-walkie-talkie',
  'fa-solid fa-wifi', 'fa-solid fa-phone', 'fa-solid fa-tv', 'fa-solid fa-plug',
  'fa-solid fa-lightbulb', 'fa-solid fa-water', 'fa-solid fa-trash', 'fa-solid fa-bag-shopping',
  'fa-solid fa-basket-shopping', 'fa-solid fa-credit-card', 'fa-solid fa-wallet', 'fa-solid fa-piggy-bank',
  'fa-solid fa-coins', 'fa-solid fa-vault', 'fa-solid fa-hand-holding-dollar', 'fa-solid fa-receipt'
];

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.scss',
})
export class CategoriesComponent implements OnInit {
  @Input() transactionType: TransactionType = 'income';
  categories: TransactionCategory[] = [];
  transactionSub!: Subscription;
  transaction!: Transaction;

  // Add category state
  isAddingNew = signal(false);
  isEditMode = signal(false);
  newCategoryName = '';
  selectedIcon = AVAILABLE_ICONS[0];
  availableIcons = AVAILABLE_ICONS;

  constructor(
    private route: ActivatedRoute,
    private categoryService: CategoryService,
    private transactionService: TransactionService
  ) { }

  toggleEditMode() {
    this.isEditMode.set(!this.isEditMode());
  }

  deleteCategory(category: TransactionCategory, event: Event) {
    event.stopPropagation(); // prevent selecting the category
    if (confirm(`Ви впевнені, що хочете видалити категорію "${category.name}"?`)) {
      this.categoryService.deleteCategory(category);
      this.loadCategories();
      // If the deleted category was selected, deselect it
      if (this.transaction?.category === category.name) {
        this.transactionService.setTransaction({
          ...this.transaction,
          category: ''
        });
      }
    }
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const type = params.get('type') as TransactionType;
      if (type === 'income' || type === 'expense') {
        this.transactionType = type;
      }

      this.loadCategories();

      this.transactionService.setTransaction({
        ...this.transaction,
        transactionType: type,
        category: '',
      });
    });

    this.transactionSub = this.transactionService.transaction$.subscribe(
      (transaction) => {
        this.transaction = transaction;
      }
    );
  }

  loadCategories() {
    this.categories = this.categoryService.getCategoryByType(this.transactionType);
  }

  onSelectCategory(category: TransactionCategory) {
    this.transactionService.setTransaction({
      ...this.transaction,
      category: category.name,
    });
  }

  isSelectedCategory(category: TransactionCategory) {
    return this.transaction?.category === category.name;
  }

  toggleAddNew() {
    this.isAddingNew.set(!this.isAddingNew());
    if (!this.isAddingNew()) {
      this.resetNewCategoryForm();
    }
  }

  selectIcon(icon: string) {
    this.selectedIcon = icon;
  }

  saveNewCategory() {
    if (!this.newCategoryName.trim()) return;

    const newCategory: TransactionCategory = {
      name: this.newCategoryName.trim(),
      icon: this.selectedIcon,
      transactionType: this.transactionType
    };

    this.categoryService.addCategory(newCategory);
    this.loadCategories();
    this.toggleAddNew();
  }

  resetNewCategoryForm() {
    this.newCategoryName = '';
    this.selectedIcon = AVAILABLE_ICONS[0];
  }
}

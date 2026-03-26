import { Transaction } from './../../types/transaction.interface';
import { Component, Input, OnInit, effect, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TransactionType } from '../../types/transaction-type.enum';
import { TransactionCategory } from '../../types/transaction-category.interface';
import { CategoryService } from '../../services/category.service';
import { TransactionService } from '../../services/transaction.service';
import { FinanceDataService, SubscriptionPeriod, Subscription } from '../../services/finance-data.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfirmService } from '../../services/confirm.service';

const AVAILABLE_ICONS = [
  // Finance & Shopping
  'fa-solid fa-money-bill-wave', 'fa-solid fa-wallet', 'fa-solid fa-piggy-bank', 'fa-solid fa-coins',
  'fa-solid fa-credit-card', 'fa-solid fa-vault', 'fa-solid fa-hand-holding-dollar', 'fa-solid fa-receipt',
  'fa-solid fa-cart-shopping', 'fa-solid fa-bag-shopping', 'fa-solid fa-basket-shopping', 'fa-solid fa-gift',
  'fa-solid fa-chart-line',
  
  // Home & Utilities
  'fa-solid fa-house-chimney', 'fa-solid fa-house-chimney-user', 'fa-solid fa-faucet-detergent', 
  'fa-solid fa-plug', 'fa-solid fa-lightbulb', 'fa-solid fa-water', 'fa-solid fa-trash',
  'fa-solid fa-wifi', 'fa-solid fa-phone', 'fa-solid fa-tv', 'fa-solid fa-laptop-code',
  
  // Transport
  'fa-solid fa-car', 'fa-solid fa-gas-pump', 'fa-solid fa-bus', 'fa-solid fa-train', 
  'fa-solid fa-bicycle', 'fa-solid fa-plane', 'fa-solid fa-hotel',
  
  // Food & Drinks
  'fa-solid fa-utensils', 'fa-solid fa-burger', 'fa-solid fa-pizza-slice', 'fa-solid fa-ice-cream',
  'fa-solid fa-cake-candles', 'fa-solid fa-apple-whole', 'fa-solid fa-carrot',
  'fa-solid fa-coffee', 'fa-solid fa-mug-hot', 'fa-solid fa-wine-glass', 'fa-solid fa-beer-mug-empty',
  
  // Leisure, Health & Hobby
  'fa-solid fa-film', 'fa-solid fa-gamepad', 'fa-solid fa-dumbbell', 'fa-solid fa-briefcase-medical',
  'fa-solid fa-graduation-cap', 'fa-solid fa-book', 'fa-solid fa-pen', 'fa-solid fa-paintbrush',
  'fa-solid fa-guitar', 'fa-solid fa-music', 'fa-solid fa-camera', 'fa-solid fa-scissors', 'fa-solid fa-hammer',
  
  // Clothing & Accessories
  'fa-solid fa-shirt', 'fa-solid fa-shoe-prints', 'fa-solid fa-socks', 'fa-solid fa-glasses',
  'fa-solid fa-ring', 'fa-solid fa-gem',
  
  // People & Faces
  'fa-solid fa-user', 'fa-solid fa-users', 'fa-solid fa-child-reaching', 'fa-solid fa-baby',
  'fa-solid fa-face-smile', 'fa-solid fa-face-laugh', 'fa-solid fa-mask', 
  'fa-solid fa-ghost', 'fa-solid fa-robot', 'fa-solid fa-skull',
  
  // Animals & Nature
  'fa-solid fa-paw', 'fa-solid fa-dog', 'fa-solid fa-cat', 'fa-solid fa-horse', 
  'fa-solid fa-bug', 'fa-solid fa-spider', 'fa-solid fa-crow', 'fa-solid fa-dove', 
  'fa-solid fa-dragon', 'fa-solid fa-fish', 'fa-solid fa-frog', 'fa-solid fa-otter',
  'fa-solid fa-tree', 'fa-solid fa-leaf', 'fa-solid fa-fire', 'fa-solid fa-snowflake', 'fa-solid fa-bolt'
];

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.scss',
})
export class CategoriesComponent implements OnInit {
  Math = Math;
  @Input() transactionType: TransactionType = 'income';
  categories: TransactionCategory[] = [];
  transaction!: Transaction;

  // Add category state
  isAddingNew = signal(false);
  isEditMode = signal(false);
  newCategoryName = '';
  newCategoryIsSub = signal(false);
  newCategorySubPeriod = signal<SubscriptionPeriod>('monthly');
  newCategorySubPrice = signal<number>(0);
  newCategorySubCurrency = signal<string>('UAH');
  newCategorySubDate = signal<string>(new Date().toISOString().split('T')[0]);
  
  selectedIcon = AVAILABLE_ICONS[0];
  availableIcons = AVAILABLE_ICONS;

  constructor(
    private route: ActivatedRoute,
    private categoryService: CategoryService,
    private transactionService: TransactionService,
    private confirmService: ConfirmService,
    public financeData: FinanceDataService
  ) {
    effect(() => {
      this.transaction = this.transactionService.transaction();
    });
  }

  toggleEditMode() {
    this.isEditMode.set(!this.isEditMode());
    this.loadCategories();
  }

  toggleVisibility(category: TransactionCategory, event: Event) {
    event.stopPropagation();
    this.categoryService.toggleCategoryVisibility(category);
    this.loadCategories();
  }

  async deleteCategory(category: TransactionCategory, event: Event) {
    event.stopPropagation(); // prevent selecting the category
    if (await this.confirmService.confirm(`Ви впевнені, що хочете видалити категорію "${category.name}"?`)) {
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
  }

  loadCategories() {
    this.categories = this.categoryService.getCategoryByType(this.transactionType, this.isEditMode());
  }

  onSelectCategory(category: TransactionCategory) {
    this.transactionService.setTransaction({
      ...this.transaction,
      category: category.name,
      amount: category.plannedAmount || 0,
      currency: category.plannedCurrency || this.financeData.userSettings().currency,
      isSubscription: category.isSubscription || false,
      subscriptionPeriod: category.subscriptionPeriod as any,
      debtId: undefined
    });
  }

  get filteredDebts() {
    return this.financeData.debts().filter(d => {
      if (this.transactionType === 'income') return d.amount > 0;
      if (this.transactionType === 'expense') return d.amount < 0;
      return false;
    });
  }

  onSelectDebt(debt: any) {
    this.transactionService.setTransaction({
      ...this.transaction,
      category: 'Борг: ' + debt.name,
      amount: Math.abs(debt.amount),
      description: 'Виконання боргу ' + debt.name,
      debtId: debt.id,
      debtName: debt.name,
      debtAmount: debt.amount
    });
  }

  isSelectedDebt(debt: any) {
    return this.transaction?.debtId === debt.id;
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

    if (this.newCategoryIsSub() && this.newCategorySubPrice() > 0) {
      const price = this.newCategorySubPrice();
      const currency = this.newCategorySubCurrency();
      const priceUah = price * this.financeData.getExchangeRate(currency, 'UAH');

      const newSub: Subscription = {
        id: Date.now().toString(),
        name: this.newCategoryName.trim(),
        price: price,
        currency: currency,
        priceUah: priceUah,
        priceEur: priceUah * this.financeData.getExchangeRate('UAH', 'EUR'),
        period: this.newCategorySubPeriod(),
        nextPaymentDate: new Date(this.newCategorySubDate()),
        totalSpent: 0
      };
      
      this.financeData.saveSubscriptions([...this.financeData.subscriptions(), newSub]);
    }

    const newCategory: TransactionCategory = {
      name: this.newCategoryName.trim(),
      icon: this.selectedIcon,
      transactionType: this.transactionType,
      isSubscription: this.newCategoryIsSub(),
      subscriptionPeriod: this.newCategoryIsSub() ? this.newCategorySubPeriod() : undefined
    };

    this.categoryService.addCategory(newCategory);
    this.loadCategories();
    this.toggleAddNew();
  }

  resetNewCategoryForm() {
    this.newCategoryName = '';
    this.newCategoryIsSub.set(false);
    this.newCategorySubPeriod.set('monthly');
    this.newCategorySubPrice.set(0);
    this.newCategorySubCurrency.set(this.financeData.userSettings().currency);
    this.newCategorySubDate.set(new Date().toISOString().split('T')[0]);
    this.selectedIcon = AVAILABLE_ICONS[0];
  }
}

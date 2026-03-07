import { Categories } from '../db/categories-list.data';
import { TransactionCategory } from '../types/transaction-category.interface';
import { TransactionType } from '../types/transaction-type.enum';
import { LocalStorageService } from './local-storage.service';
import { Injectable, inject } from '@angular/core';
import { FinanceDataService } from './finance-data.service';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private readonly StorageKey = 'Categories';
  private financeData = inject(FinanceDataService);

  constructor(private localStorageService: LocalStorageService) { }

  getCategories(): TransactionCategory[] {
    const localCategories: TransactionCategory[] = this.localStorageService.get(this.StorageKey);

    if (localCategories && localCategories.length > 0) {
      // Fix missing icons for existing items in LocalStorage
      let needsUpdate = false;
      const defaultCategories = Categories as TransactionCategory[];

      const mergedCategories = localCategories.map(cat => {
        if (!cat.icon || cat.icon.trim() === '' || cat.icon === 'fa-solid fa-faucet-detergent') {
          needsUpdate = true;
          const defaultCat = defaultCategories.find(dc => dc.name === cat.name);
          return {
            ...cat,
            icon: defaultCat ? defaultCat.icon : 'fa-solid fa-tags' // generic fallback
          };
        }
        return cat;
      });

      if (needsUpdate) {
        this.localStorageService.set(this.StorageKey, mergedCategories);
      }

      return mergedCategories;
    }

    return this.initCategories();
  }

  getCategoryByType(type: TransactionType | '', showHidden = false): TransactionCategory[] {
    let categories: TransactionCategory[] = this.getCategories();

    if (!showHidden) {
      categories = categories.filter(c => !c.isHidden);
    }

    if (type === '') {
      return categories;
    }

    const filtered = categories.filter(
      (category) => category.transactionType === type
    );

    // Merge in planned items as categories if they don't exist
    if (type === 'income') {
      const plans = this.financeData.getIncomePlansWithFact();
      plans.forEach(p => {
        const remaining = p.planAmount - p.factAmount;
        // If it's a one-time plan and it's already covered, skip it
        if (!p.isRecurring && remaining <= 0) return;

        if (!filtered.some(c => c.name.toLowerCase() === p.category.toLowerCase())) {
          filtered.push({
            name: p.category,
            icon: 'fa-solid fa-bullseye',
            transactionType: 'income',
            plannedAmount: remaining > 0 ? remaining : p.planAmount
          } as TransactionCategory);
        }
      });
    } else if (type === 'expense') {
      const plans = this.financeData.getExpensePlansWithFact();
      plans.forEach(p => {
        const remaining = p.amount - p.factAmount;
        // If it's a one-time plan and it's already covered, skip it
        if (!p.isRecurring && remaining <= 0) return;

        if (!filtered.some(c => c.name.toLowerCase() === p.category.toLowerCase())) {
          filtered.push({
            name: p.category,
            icon: 'fa-solid fa-bullseye',
            transactionType: 'expense',
            plannedAmount: remaining > 0 ? remaining : p.amount
          } as TransactionCategory);
        }
      });

      // Also include active subscriptions as virtual categories
      const subs = this.financeData.subscriptions();
      subs.forEach(s => {
        if (!filtered.some(c => c.name.toLowerCase().includes(s.name.toLowerCase()))) {
          filtered.push({
            name: `Sub: ${s.name}`,
            icon: 'fa-solid fa-calendar-check',
            transactionType: 'expense',
            plannedAmount: s.priceUah
          } as TransactionCategory);
        }
      });
    }

    // Sort: put items with plannedAmount first
    return filtered.sort((a, b) => {
      if (a.plannedAmount && !b.plannedAmount) return -1;
      if (!a.plannedAmount && b.plannedAmount) return 1;
      return 0;
    });
  }

  addCategory(category: TransactionCategory): void {
    const categories = this.getCategories();
    categories.push(category);
    this.localStorageService.set(this.StorageKey, categories);
  }

  toggleCategoryVisibility(category: TransactionCategory): void {
    const categories = this.getCategories();
    const idx = categories.findIndex(c => c.name === category.name && c.transactionType === category.transactionType);
    if (idx !== -1) {
      categories[idx].isHidden = !categories[idx].isHidden;
      this.localStorageService.set(this.StorageKey, categories);
    }
  }

  initCategories(): TransactionCategory[] {
    const categories: TransactionCategory[] = Categories as TransactionCategory[];
    this.localStorageService.set(this.StorageKey, categories);
    return categories;
  }

  deleteCategory(category: TransactionCategory): void {
    let categories = this.getCategories();
    categories = categories.filter(c => !(c.name === category.name && c.transactionType === category.transactionType));
    this.localStorageService.set(this.StorageKey, categories);
  }
}

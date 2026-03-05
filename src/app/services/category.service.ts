import { Categories } from '../db/categories';
import { TransactionCategory } from '../types/transaction-category';
import { TransactionType } from '../types/transaction-type';
import { LocalStorageService } from './local-storage.service';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private readonly StorageKey = 'Categories';

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

      // Also check if there are any default categories missing in local storage entirely
      for (const defaultCat of defaultCategories) {
        if (!mergedCategories.some(cat => cat.name === defaultCat.name)) {
          needsUpdate = true;
          mergedCategories.push(defaultCat);
        }
      }

      if (needsUpdate) {
        this.localStorageService.set(this.StorageKey, mergedCategories);
      }

      return mergedCategories;
    }

    return this.initCategories();
  }


  initCategories(): TransactionCategory[] {
    const categories: TransactionCategory[] = Categories as TransactionCategory[];

    this.localStorageService.set(this.StorageKey, categories);
    return this.localStorageService.get(this.StorageKey);
  }


  getCategoryByType(type: TransactionType | ''): TransactionCategory[] {
    const categories: TransactionCategory[] = this.getCategories();

    if (type === '') {
      return categories;
    }

    return categories.filter(
      (category) => category.transactionType === type
    );
  }

  addCategory(category: TransactionCategory): void {
    const categories = this.getCategories();
    categories.push(category);
    this.localStorageService.set(this.StorageKey, categories);
  }

  deleteCategory(category: TransactionCategory): void {
    let categories = this.getCategories();
    categories = categories.filter(c => !(c.name === category.name && c.transactionType === category.transactionType));
    this.localStorageService.set(this.StorageKey, categories);
  }
}

import { Categories } from '../db/Categories';
import { TransactionCategory } from '../types/TransactionCategory';
import { TransactionType } from '../types/TransactionType';
import { LocalStorageService } from './local-storage.service';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private readonly StorageKey = 'Categories';

  constructor(private localStorageService: LocalStorageService) {}

  getCategories(): TransactionCategory[] {
    if (this.localStorageService.get(this.StorageKey)) {
      return this.localStorageService.get(this.StorageKey);
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

    if(type === '') {
      return categories;
    }

    return categories.filter(
      (category) => category.transactionType === type
    );
  }
}

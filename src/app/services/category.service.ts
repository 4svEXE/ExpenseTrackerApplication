import { Categories } from '../db/Categories';
import { TransactionCategory } from '../types/TransactionCategory';
import { LocalStorageService } from './local-storage.service';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private readonly StorageKey = 'Categories';
  categories: TransactionCategory[] = Categories as TransactionCategory[];

  constructor(private localStorageService: LocalStorageService) {}

  getCategories(): TransactionCategory[] {
    if (this.localStorageService.get(this.StorageKey)) {
      return this.localStorageService.get(this.StorageKey);
    }

    return this.initCategories();
  }

  initCategories(): TransactionCategory[] {
    this.localStorageService.set(this.StorageKey, this.categories);
    return this.localStorageService.get(this.StorageKey);
  }
}

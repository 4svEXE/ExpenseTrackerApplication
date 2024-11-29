import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LocalStorageService {
  constructor() {}

  set(key: string, value: any) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  get(key: string) {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  }

  remove(key: string) {
    localStorage.removeItem(key);
  }
}

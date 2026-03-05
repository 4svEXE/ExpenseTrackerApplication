import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceDataService, UserSettings, IncomePlan, ExpensePlan } from '../../services/finance-data.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent implements OnInit {
  financeData = inject(FinanceDataService);

  // Local state for forms
  settings: UserSettings = {
    name: '',
    monthlyIncomeGoal: 0,
    currency: 'UAH',
    soundEnabled: true,
    soundVolume: 0.5,
    vibrationEnabled: true
  };
  incomePlans: IncomePlan[] = [];
  expensePlans: ExpensePlan[] = [];

  currencies = ['UAH', 'USD', 'EUR', 'CZK'];

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    // Clone data to avoid direct mutation before saving
    this.settings = { ...this.financeData.userSettings() };
    this.incomePlans = JSON.parse(JSON.stringify(this.financeData.incomePlans()));
    this.expensePlans = JSON.parse(JSON.stringify(this.financeData.expensePlans()));
  }

  saveSettings() {
    this.financeData.saveSettings(this.settings);
    alert('Загальні налаштування збережено!');
  }

  // --- Income Plans ---
  addIncomePlan() {
    this.incomePlans.push({
      id: Date.now().toString(),
      category: '',
      planAmount: 0,
      factAmount: 0
    });
  }

  removeIncomePlan(index: number) {
    this.incomePlans.splice(index, 1);
  }

  saveIncomePlans() {
    this.financeData.saveIncomePlans(this.incomePlans);
    alert('Плани доходів збережено!');
  }

  // --- Expense Plans ---
  addExpensePlan() {
    this.expensePlans.push({
      id: Date.now().toString(),
      category: '',
      type: 'mandatory',
      amount: 0
    });
  }

  removeExpensePlan(index: number) {
    this.expensePlans.splice(index, 1);
  }

  saveExpensePlans() {
    this.financeData.saveExpensePlans(this.expensePlans);
    alert('Плани витрат збережено!');
  }

  // --- Data Management ---
  loadMockData() {
    if (confirm('Видалити всі поточні дані та завантажити тестові?')) {
      this.financeData.loadMockData();
      this.loadData();
      alert('Тестові дані завантажено.');
    }
  }

  clearAllData() {
    if (confirm('Ви впевнені, що хочете видалити всі транзакції та плани? Цю дію неможливо скасувати.')) {
      this.financeData.clearAllData();
      this.loadData();
      alert('Усі дані видалено.');
    }
  }
}


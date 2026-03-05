import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceDataService, UserSettings, IncomePlan, ExpensePlan } from '../../services/finance-data.service';
import { AudioService } from '../../services/audio.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent implements OnInit {
  financeData = inject(FinanceDataService);
  audio = inject(AudioService);

  // Local state for forms
  settings: UserSettings = {
    name: '',
    monthlyIncomeGoal: 0,
    currency: 'UAH',
    soundEnabled: true,
    soundVolume: 0.5,
    vibrationEnabled: true,
    taxRate: 0,
    taxFixedAmount: 0,
    notificationEnabled: true,
    notificationTime: '20:00',
    notificationText: 'Час заповнити витрати! 💸',
    gamificationEnabled: true,
    coins: 0
  };

  currencies = ['UAH', 'USD', 'EUR', 'CZK'];

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.settings = { ...this.financeData.userSettings() };
  }

  saveSettings() {
    this.financeData.saveSettings(this.settings);
    alert('Налаштування збережено!');
  }

  playTestSound() {
    this.audio.playTest(this.settings.soundVolume);
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


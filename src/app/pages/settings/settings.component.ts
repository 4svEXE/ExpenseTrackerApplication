import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceDataService, UserSettings } from '../../services/finance-data.service';
import { AudioService } from '../../services/audio.service';
import { NotificationService } from '../../services/notification.service';
import { ConfirmService } from '../../services/confirm.service';
import { SupportService } from '../../services/support.service';
import { AiConsultantComponent } from '../../components/ui/ai-consultant/ai-consultant.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, AiConsultantComponent],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent implements OnInit {
  financeData = inject(FinanceDataService);
  audio = inject(AudioService);
  notification = inject(NotificationService);
  confirmService = inject(ConfirmService);
  supportService = inject(SupportService);

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
    taxFixedCurrency: 'UAH',
    notificationEnabled: true,
    notificationTime: '20:00',
    notificationText: 'Час заповнити витрати! 💸',
    gamificationEnabled: true,
    supportDonationReminder: true,
    coins: 0,
    avatarUrl: '',
    geminiApiKey: ''
  };

  activeCategory: 'menu' | 'profile' | 'notifications' | 'gamification' | 'accessibility' | 'data' = 'menu';

  currencies = ['UAH', 'USD', 'EUR', 'CZK'];

  ngOnInit() {
    this.loadData();
  }

  setCategory(cat: any) {
    this.activeCategory = cat;
  }

  goBack() {
    this.activeCategory = 'menu';
  }

  randomizeAvatar() {
    const seed = Math.random().toString(36).substring(7);
    this.settings.avatarUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}`;
  }

  loadData() {
    this.settings = { ...this.financeData.userSettings() };
  }

  saveSettings() {
    this.financeData.saveSettings(this.settings);
    // Use toast instead of alert if possible, but financeData has one
  }

  playTestSound() {
    this.audio.playTest(this.settings.soundVolume);
  }

  testNotification() {
    this.notification.showNotification('Тестове сповіщення', 'Якщо ви це бачите, сповіщення працюють! 🎉');
  }

  // --- Data Management ---
  async loadMockData() {
    if (await this.confirmService.confirm('Видалити всі поточні дані та завантажити тестові?')) {
      this.financeData.loadMockData();
      this.loadData();
    }
  }

  async clearAllData() {
    if (await this.confirmService.confirm('Ви впевнені, що хочете видалити всі транзакції та плани? Цю дію неможливо скасувати.')) {
      this.financeData.clearAllData();
      this.loadData();
    }
  }

  exportBackup() {
    this.financeData.exportData();
  }

  onFileImport(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.financeData.importData(file);
    }
  }

  onAccessibilityChange(event: any, type: 'visual' | 'colorblind') {
    if (type === 'visual') {
      this.settings.visualImpairmentMode = event.target.checked;
    } else {
      this.settings.colorBlindMode = event.target.checked;
    }
  }

  onSupportToggle() {
    const current = this.financeData.userSettings().supportDonationReminder;
    if (current && !this.settings.supportDonationReminder) {
      this.supportService.showFeedbackLoop();
      this.settings.supportDonationReminder = true;
    }
  }
}

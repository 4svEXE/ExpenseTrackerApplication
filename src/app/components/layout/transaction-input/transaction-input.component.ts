import { CommonModule } from '@angular/common';
import { Component, OnInit, effect, inject, signal } from '@angular/core';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { TransactionService } from '../../../services/transaction.service';
import { ErrorMessageComponent } from '../../error-message/error-message.component';
import { Transaction } from '../../../types/transaction.interface';
import { FinanceDataService, Subscription, SubscriptionPeriod } from '../../../services/finance-data.service';
import { AudioService } from '../../../services/audio.service';
import { CoinAnimationService } from '../../../services/coin-animation.service';
import { SupportService } from '../../../services/support.service';

@Component({
  selector: 'app-transaction-input',
  templateUrl: './transaction-input.component.html',
  styleUrls: ['./transaction-input.component.scss'],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ErrorMessageComponent],
})
export class TransactionInputComponent implements OnInit {
  transactionForm!: FormGroup;
  transaction: Transaction = {
    amount: 0,
    currency: '',
    category: '',
    date: '',
    description: '',
    transactionType: 'income'
  };

  // Error messages as component property to avoid apostrophe issues in template
  amountErrors = {
    required: 'Поле суми обов\u2019язкове.',
    min: 'Сума має бути більше 0.01.',
    max: 'Сума занадто велика.',
    pattern: 'Некоректний формат числа (макс. 2 знаки).'
  };

  financeData = inject(FinanceDataService);
  accounts = this.financeData.accounts;
  audio = inject(AudioService);

  // Subscription fields
  isSubscription = signal(false);
  subPeriod = signal<SubscriptionPeriod>('monthly');
  subNextDate = signal(new Date().toISOString().split('T')[0]);
  subCustomDays = signal(30);

  // Details & Debt
  isDetailsOpen = signal(false);
  isDebt = signal(false);

  constructor(
    private fb: FormBuilder,
    private transactionService: TransactionService,
    private router: Router,
    private coinService: CoinAnimationService,
    private supportService: SupportService
  ) {
    effect(() => {
      const transaction = this.transactionService.transaction();
      this.transaction = transaction;
      if (this.transactionForm && transaction && (transaction.amount > 0 || transaction.category)) {
        let formDate = '';
        if (transaction.date) {
           formDate = new Date(transaction.date).toISOString().slice(0, 16);
        } else {
           const now = new Date();
           formDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
        }

        this.transactionForm.patchValue({ 
          amount: transaction.amount > 0 ? transaction.amount : null,
          currency: transaction.currency || this.financeData.userSettings().currency,
          description: transaction.description || '',
          date: formDate,
          accountId: transaction.accountId || this.transactionForm.get('accountId')?.value
        }, { emitEvent: false });
        if (transaction.isSubscription) {
          this.isSubscription.set(true);
          if (transaction.subscriptionPeriod) this.subPeriod.set(transaction.subscriptionPeriod);
          if (transaction.subscriptionNextDate) this.subNextDate.set(transaction.subscriptionNextDate);
        }
      }
    });
  }

  onAmountInput(event: any): void {
    const input = event.target;
    let value = input.value.toString();
    
    if (value && value.includes('.')) {
      const parts = value.split('.');
      if (parts.length > 1 && parts[1].length > 2) {
        // Truncate to 2 decimal places
        const truncated = parts[0] + '.' + parts[1].substring(0, 2);
        input.value = truncated;
        this.transactionForm.get('amount')?.setValue(truncated, { emitEvent: false });
      }
    }
  }

  ngOnInit(): void {
    const lastAccountId = localStorage.getItem('lastAccountId') || (this.accounts().length > 0 ? this.accounts()[0].id : '');

    const now = new Date();
    const localNow = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

    this.transactionForm = this.fb.group({
      accountId: [lastAccountId, [Validators.required]],
      date: [localNow, [Validators.required]],
      currency: [this.financeData.userSettings().currency, [Validators.required]],
      amount: [
        null,
        [
          Validators.required,
          Validators.min(0.01),
          Validators.max(999999999),
          Validators.pattern(/^\d+(\.\d{1,2})?$/),
        ],
      ],
      description: ['', [Validators.maxLength(50)]],
    });
  }

  clearAmount(): void {
    this.transactionForm.patchValue({ amount: null });
  }

  closeTransaction(): void {
    this.isSubscription.set(false);
    this.transactionService.setTransaction({
      amount: 0,
      currency: this.financeData.userSettings().currency,
      category: '',
      date: '',
      description: '',
      transactionType: 'income',
    });
    this.transactionForm.reset({ accountId: this.transactionForm.get('accountId')?.value });
  }

  isValidTransactionCategory() {
    return this.transaction && this.transaction.category && this.transaction.category !== '';
  }

  deleteLast(): void {
    const currentAmount = this.transactionForm.get('amount')?.value?.toString() || '';
    const newValue = currentAmount.slice(0, -1);
    this.transactionForm.patchValue({
      amount: parseFloat(newValue) || 0,
    });
  }

  toggleSubscription() {
    this.isSubscription.set(!this.isSubscription());
    if (this.isSubscription()) {
      this.isDebt.set(false);
      this.isDetailsOpen.set(true);
    }
  }

  toggleDetails() {
    this.isDetailsOpen.set(!this.isDetailsOpen());
  }

  toggleDebt() {
    this.isDebt.set(!this.isDebt());
  }

  onSubmit(event?: MouseEvent | PointerEvent): void {
    if (this.transactionForm.valid) {
      const formValue = this.transactionForm.value;
      const tType = this.transaction.transactionType || 'expense';
      const targetAccount = this.accounts().find(a => a.id === formValue.accountId);

      if (!targetAccount) {
        this.financeData.toasts.show('Будь ласка, оберіть існуючий рахунок.', 'error');
        return;
      }

      let finalAmount = formValue.amount;
      if (targetAccount && formValue.currency !== targetAccount.currency) {
        finalAmount = formValue.amount * this.financeData.getExchangeRate(formValue.currency, targetAccount.currency);
      }

      if (this.transaction.debtId) {
        this.financeData.executeDebt(this.transaction.debtId, formValue.accountId, finalAmount);
      } else {
        // --- EDITING MODE ---
        if (this.transaction.id) {
          // 1. Reverse the effect of the OLD transaction on the OLD account
          const oldTType = this.transaction.transactionType || 'expense';
          const reverseType = oldTType === 'income' ? 'expense' : 'income';
          let oldAccountId = this.transaction.accountId;
          
          // Fallback if accountId was missing (legacy data)
          if (!oldAccountId && this.accounts().length > 0) oldAccountId = this.accounts()[0].id;

          if (oldAccountId) {
            const oldAccount = this.accounts().find(a => a.id === oldAccountId);
            let amountToReverse = this.transaction.amount;
            
            // Adjust for currency if the transaction currency is different from the account currency
            const txCurrency = this.transaction.currency || this.financeData.userSettings().currency;
            if (oldAccount && txCurrency !== oldAccount.currency) {
              amountToReverse = this.transaction.amount * this.financeData.getExchangeRate(txCurrency, oldAccount.currency);
            }
            
            this.financeData.adjustAccountBalance(oldAccountId, amountToReverse, reverseType);
          }

          // 2. Update the transaction record
          this.transactionService.updateTransaction({
            ...this.transaction,
            amount: formValue.amount,
            currency: formValue.currency,
            description: formValue.description,
            accountId: formValue.accountId,
            date: new Date(formValue.date).toISOString(),
            isSubscription: this.isSubscription(),
            subscriptionPeriod: this.isSubscription() ? this.subPeriod() : undefined,
            subscriptionNextDate: this.isSubscription() ? this.subNextDate() : undefined,
            subscriptionName: this.isSubscription() ? (this.transaction.category || formValue.description) : undefined,
            subscriptionCustomDays: this.isSubscription() && this.subPeriod() === 'custom' ? this.subCustomDays() : undefined,
          });
        } else {
          // --- NEW TRANSACTION MODE ---
          this.transactionService.addTransaction({
            ...this.transaction,
            amount: formValue.amount,
            currency: formValue.currency,
            description: formValue.description,
            accountId: formValue.accountId,
            date: new Date(formValue.date).toISOString(),
            isSubscription: this.isSubscription(),
            subscriptionPeriod: this.isSubscription() ? this.subPeriod() : undefined,
            subscriptionNextDate: this.isSubscription() ? this.subNextDate() : undefined,
            subscriptionName: this.isSubscription() ? (this.transaction.category || formValue.description) : undefined,
            subscriptionCustomDays: this.isSubscription() && this.subPeriod() === 'custom' ? this.subCustomDays() : undefined,
          });
        }

        // 3. Apply the effect of the NEW transaction (common for both modes)
        this.financeData.adjustAccountBalance(
          formValue.accountId,
          finalAmount,
          tType as 'income' | 'expense'
        );

        // Removed dynamic subscription creation from single transactions

        // If marked as debt
        if (this.isDebt()) {
          const currency = formValue.currency;
          const debtAmount = tType === 'expense' ? formValue.amount : -formValue.amount;
          const newDebt = {
            id: Date.now().toString(),
            name: this.transaction.category || formValue.description || 'Борг',
            amount: debtAmount,
            currency: currency
          };
          this.financeData.saveDebts([newDebt, ...this.financeData.debts()]);
          this.financeData.toasts.show('Запис додано до боргів!', 'success');
        }

        if (tType === 'income') {
          this.audio.playIncome();
        } else {
          this.audio.playOutcome();
        }

        if (tType === 'income') {
          this.supportService.showDonationRequest();
        }
      }

      // Shared logic
      if (event && this.financeData.userSettings().gamificationEnabled) {
        this.coinService.animate(event.clientX, event.clientY);
      }

      if (this.financeData.userSettings().showPlanPostTransaction && tType === 'income') {
        setTimeout(() => {
          this.financeData.showPlanPopup.set(true);
        }, event ? 1000 : 0);
      }

      localStorage.setItem('lastAccountId', formValue.accountId);

      this.isSubscription.set(false);
      this.transactionService.setTransaction({
        amount: 0,
        currency: this.financeData.userSettings().currency,
        category: '',
        date: '',
        description: '',
        transactionType: tType as any,
      });
      this.transactionForm.reset();
      this.router.navigate(['/home']);
    } else {
      this.transactionForm.markAllAsTouched();
    }
  }
}

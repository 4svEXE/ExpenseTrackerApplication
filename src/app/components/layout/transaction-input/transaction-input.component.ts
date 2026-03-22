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
    pattern: 'До 2 знаків після коми.'
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
        this.transactionForm.patchValue({ 
          amount: transaction.amount > 0 ? transaction.amount : null,
          currency: transaction.currency || this.financeData.userSettings().currency
        }, { emitEvent: false });
        if (transaction.isSubscription) {
          this.isSubscription.set(true);
          if (transaction.subscriptionPeriod) this.subPeriod.set(transaction.subscriptionPeriod);
          if (transaction.subscriptionNextDate) this.subNextDate.set(transaction.subscriptionNextDate);
        }
      }
    });
  }

  ngOnInit(): void {
    const lastAccountId = localStorage.getItem('lastAccountId') || (this.accounts().length > 0 ? this.accounts()[0].id : '');

    this.transactionForm = this.fb.group({
      accountId: [lastAccountId, [Validators.required]],
      currency: [this.financeData.userSettings().currency, [Validators.required]],
      amount: [
        null,
        [
          Validators.required,
          Validators.min(0.01),
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

      let finalAmount = formValue.amount;
      if (targetAccount && formValue.currency !== targetAccount.currency) {
        finalAmount = formValue.amount * this.financeData.getExchangeRate(formValue.currency, targetAccount.currency);
      }

      if (this.transaction.debtId) {
        this.financeData.executeDebt(this.transaction.debtId, formValue.accountId, finalAmount);
      } else {
        // Regular Transaction
        this.transactionService.addTransaction({
          ...this.transaction,
          amount: formValue.amount,
          currency: formValue.currency,
          description: formValue.description,
          accountId: formValue.accountId,
          date: new Date().toISOString(),
          isSubscription: this.isSubscription(),
          subscriptionPeriod: this.isSubscription() ? this.subPeriod() : undefined,
          subscriptionNextDate: this.isSubscription() ? this.subNextDate() : undefined,
          subscriptionName: this.isSubscription() ? (this.transaction.category || formValue.description) : undefined,
          subscriptionCustomDays: this.isSubscription() && this.subPeriod() === 'custom' ? this.subCustomDays() : undefined,
        });

        this.financeData.adjustAccountBalance(
          formValue.accountId,
          finalAmount,
          tType as 'income' | 'expense'
        );

        // If marked as subscription — also add to subscriptions list
        if (this.isSubscription()) {
          const currency = formValue.currency;
          const priceUah = finalAmount * this.financeData.getExchangeRate(targetAccount?.currency || currency, 'UAH');
          const newSub: Subscription = {
            id: Date.now().toString(),
            name: this.transaction.category || formValue.description || 'Підписка',
            price: formValue.amount,
            currency: currency,
            priceUah: priceUah,
            priceEur: priceUah * this.financeData.getExchangeRate('UAH', 'EUR'),
            period: this.subPeriod(),
            customDays: this.subPeriod() === 'custom' ? this.subCustomDays() : undefined,
            nextPaymentDate: new Date(this.subNextDate()),
            totalSpent: formValue.amount
          };
          const subs = [...this.financeData.subscriptions(), newSub];
          this.financeData.saveSubscriptions(subs);
          this.financeData.toasts.show('Підписку додано до списку!', 'success');
        }

        // If marked as debt
        if (this.isDebt()) {
          const currency = formValue.currency;
          const debtAmount = tType === 'expense' ? -formValue.amount : formValue.amount;
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
      this.transactionForm.reset();
      this.router.navigate(['/home']);
    } else {
      this.transactionForm.markAllAsTouched();
    }
  }
}

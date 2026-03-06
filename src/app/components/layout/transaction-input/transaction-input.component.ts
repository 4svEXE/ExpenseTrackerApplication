import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { TransactionService } from '../../../services/transaction.service';
import { ErrorMessageComponent } from '../../error-message/error-message.component';
import { Transaction } from '../../../types/transaction.interface';
import { FinanceDataService } from '../../../services/finance-data.service';
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
  transactionSub!: Subscription;
  transaction: Transaction = {
    amount: 0,
    category: '',
    date: '',
    description: '',
    transactionType: 'income'
  };

  financeData = inject(FinanceDataService);
  accounts = this.financeData.accounts;

  audio = inject(AudioService);

  constructor(
    private fb: FormBuilder,
    private transactionService: TransactionService,
    private router: Router,
    private coinService: CoinAnimationService,
    private supportService: SupportService
  ) { }

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

    this.transactionSub = this.transactionService.transaction$.subscribe(
      (transaction) => {
        this.transaction = transaction;
        if (transaction && transaction.amount > 0) {
          this.transactionForm.patchValue({ amount: transaction.amount });
        }
      }
    );
  }

  clearAmount(): void {
    this.transactionForm.patchValue({ amount: null });
  }

  closeTransaction(): void {
    this.transactionService.setTransaction({
      amount: 0,
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

  onSubmit(event?: MouseEvent | PointerEvent): void {
    if (this.transactionForm.valid) {
      const formValue = this.transactionForm.value;
      const tType = this.transaction.transactionType || 'expense';
      const targetAccount = this.accounts().find(a => a.id === formValue.accountId);

      let finalAmount = formValue.amount;
      if (targetAccount && formValue.currency !== targetAccount.currency) {
        finalAmount = formValue.amount * this.financeData.getExchangeRate(formValue.currency, targetAccount.currency);
      }

      // 1. Add Transaction
      this.transactionService.addTransaction({
        ...this.transaction,
        amount: finalAmount,
        description: formValue.description,
        accountId: formValue.accountId,
        date: new Date().toISOString(),
      });

      // 2. Adjust Balance
      this.financeData.adjustAccountBalance(
        formValue.accountId,
        finalAmount,
        tType as 'income' | 'expense'
      );

      // 3. Audio & Haptic feedback
      if (tType === 'income') {
        this.audio.playIncome();
      } else {
        this.audio.playOutcome();
      }

      // 4. Gamification Animation
      if (event && this.financeData.userSettings().gamificationEnabled) {
        this.coinService.animate(event.clientX, event.clientY);
      }

      // 4.5. Support Reminder for Income
      if (tType === 'income') {
        this.supportService.showDonationRequest();
      }
      // 5. Show Plan Popup?
      if (this.financeData.userSettings().showPlanPostTransaction) {
        setTimeout(() => {
          this.financeData.showPlanPopup.set(true);
        }, event ? 1000 : 0);
      }

      localStorage.setItem('lastAccountId', formValue.accountId);

      this.transactionForm.reset();
      this.router.navigate(['/home']);
    } else {
      this.transactionForm.markAllAsTouched();
    }
  }
}

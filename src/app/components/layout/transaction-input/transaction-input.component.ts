import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { TransactionService } from '../../../services/transaction.service';
import { Transaction } from '../../../types/Transaction';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-transaction-input',
  templateUrl: './transaction-input.component.html',
  styleUrls: ['./transaction-input.component.scss'],
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
})
export class TransactionInputComponent implements OnInit {
  transactionForm!: FormGroup;
  transactionSub!: Subscription;
  transaction!: Transaction;

  constructor(
    private fb: FormBuilder,
    private transactionService: TransactionService
  ) {}

  ngOnInit(): void {
    this.transactionForm = this.fb.group({
      amount: [
        0,
        [
          Validators.required,
          Validators.min(0.01),
          Validators.pattern(/^\d+(\.\d{1,2})?$/),
        ],
      ],
      description: ['', [Validators.required, Validators.maxLength(50)]],
    });

    this.transactionSub = this.transactionService.transaction$.subscribe(
      (transaction) => {
        this.transaction = transaction;
      }
    );
  }

  clearAmount(): void {
    this.transactionForm.patchValue({ amount: 0 });
  }

  isValidTransactionCategory(){
    return this.transaction.category !== ''
  }

  deleteLast(): void {
    const currentAmount = this.transactionForm.get('amount')?.value.toString();
    const newValue = currentAmount.slice(0, -1);
    this.transactionForm.patchValue({
      amount: parseFloat(newValue) || 0,
    });
  }

  onSubmit(): void {
    if (this.transactionForm.valid) {
      this.transactionService.addTransaction({
        ...this.transaction,
        ...this.transactionForm.value,
        date: new Date().toISOString()
      });

      console.log(this.transaction);

      this.transactionForm.reset();
    } else {
      this.transactionForm.markAllAsTouched();
    }
  }
}

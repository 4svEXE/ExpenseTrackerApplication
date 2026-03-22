import { TransactionType } from "./transaction-type.enum";


export type Transaction = {
  date: string;
  description: string;
  amount: number;
  currency: string;
  category: string;
  transactionType: TransactionType;
  accountId?: string;
  debtId?: string;
  debtName?: string;
  debtAmount?: number;
  // Subscription support
  isSubscription?: boolean;
  subscriptionPeriod?: 'monthly' | '3months' | 'yearly' | 'custom';
  subscriptionNextDate?: string;
  subscriptionName?: string;
  subscriptionCustomDays?: number;
};


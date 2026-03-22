import { TransactionType } from "./transaction-type.enum";

export interface TransactionCategory {
  name: string;
  icon: string;
  transactionType: TransactionType;
  plannedAmount?: number;
  plannedCurrency?: string;
  isHidden?: boolean;
  isSubscription?: boolean;
  subscriptionPeriod?: string;
}

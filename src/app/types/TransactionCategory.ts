import { TransactionType } from "./TransactionType";

export interface TransactionCategory {
  name: string;
  icon: string;
  transactionType: TransactionType;
}

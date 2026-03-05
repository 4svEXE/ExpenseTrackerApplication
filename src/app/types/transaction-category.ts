import { TransactionType } from "./transaction-type";

export interface TransactionCategory {
  name: string;
  icon: string;
  transactionType: TransactionType;
}

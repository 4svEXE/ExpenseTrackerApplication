import { TransactionType } from "./TransactionType";

export interface TransactionCategory {
  name: string;
  image: string;
  transactionType: TransactionType;
}

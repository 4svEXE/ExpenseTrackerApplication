import { TransactionType } from "./transactionType";

export interface TransactionCategory {
  name: string;
  image: string;
  transactionType: TransactionType;
}

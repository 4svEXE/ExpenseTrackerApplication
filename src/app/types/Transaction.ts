import { TransactionType } from "./TransactionType";


export type Transaction = {
  date: string;
  description: string;
  amount: number;
  category: string;
  transactionType: TransactionType;
};

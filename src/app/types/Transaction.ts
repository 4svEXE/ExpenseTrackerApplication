import { TransactionType } from "./transaction-type";


export type Transaction = {
  date: string;
  description: string;
  amount: number;
  category: string;
  transactionType: TransactionType;
  accountId?: string;
};

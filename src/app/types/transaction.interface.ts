import { TransactionType } from "./transaction-type.enum";


export type Transaction = {
  date: string;
  description: string;
  amount: number;
  category: string;
  transactionType: TransactionType;
  accountId?: string;
};

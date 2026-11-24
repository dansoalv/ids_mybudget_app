export type CurrencyCode = "MXN";

export type TransactionType = "income" | "expense";

export type TransactionScope = "personal" | "shared";

export type TransactionCategory =
  | "food"
  | "home"
  | "transport"
  | "entertainment"
  | "salary"
  | "other";

export type Transaction = {
  id: string;
  title: string;
  amountCents: number;
  currency: CurrencyCode;
  type: TransactionType;
  scope: TransactionScope;
  category: TransactionCategory;
  occurredAt: string;
  groupName?: string;
};

export type SharedBalance = {
  id: string;
  groupName: string;
  memberName: string;
  amountCents: number;
  direction: "owed_to_you" | "you_owe" | "settled";
};

export type MonthlySummary = {
  incomeCents: number;
  expenseCents: number;
  balanceCents: number;
};

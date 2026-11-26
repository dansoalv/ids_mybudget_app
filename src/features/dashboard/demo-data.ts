import type { SharedBalance, Transaction } from "@/types/finance";

export const personalTransactions: Transaction[] = [
  {
    id: "trx-salary",
    title: "Nómina",
    amountCents: 2850000,
    currency: "MXN",
    type: "income",
    scope: "personal",
    category: "salary",
    occurredAt: "2026-11-15T09:00:00.000Z",
  },
  {
    id: "trx-coffee",
    title: "Café y desayuno",
    amountCents: 23800,
    currency: "MXN",
    type: "expense",
    scope: "personal",
    category: "food",
    occurredAt: "2026-11-19T15:20:00.000Z",
  },
  {
    id: "trx-uber",
    title: "Uber",
    amountCents: 17650,
    currency: "MXN",
    type: "expense",
    scope: "personal",
    category: "transport",
    occurredAt: "2026-11-18T23:10:00.000Z",
  },
];

export const sharedBalances: SharedBalance[] = [
  {
    id: "balance-casa",
    groupName: "Casa",
    memberName: "Ana",
    amountCents: 124500,
    direction: "owed_to_you",
  },
  {
    id: "balance-viaje",
    groupName: "Viaje Oaxaca",
    memberName: "Luis",
    amountCents: 86000,
    direction: "you_owe",
  },
];

"use client";

import { openDB, type DBSchema } from "idb";

export type QueuedTransaction = {
  id: string;
  title: string;
  amountCents: number;
  category: string;
  type: "income" | "expense";
  occurredAt: string;
  queuedAt: string;
};

interface MyBudgetDB extends DBSchema {
  pendingTransactions: {
    key: string;
    value: QueuedTransaction;
    indexes: { "by-queued-at": string };
  };
}

function getDatabase() {
  return openDB<MyBudgetDB>("mybudget-offline", 1, {
    upgrade(db) {
      const store = db.createObjectStore("pendingTransactions", { keyPath: "id" });
      store.createIndex("by-queued-at", "queuedAt");
    },
  });
}

export async function queueTransaction(transaction: Omit<QueuedTransaction, "queuedAt">) {
  const db = await getDatabase();
  await db.put("pendingTransactions", {
    ...transaction,
    queuedAt: new Date().toISOString(),
  });
}

export async function flushTransactionQueue(): Promise<number> {
  const db = await getDatabase();
  const pending = await db.getAllFromIndex("pendingTransactions", "by-queued-at");
  let synced = 0;

  for (const transaction of pending) {
    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transaction),
      });

      if (response.ok || response.status === 409) {
        await db.delete("pendingTransactions", transaction.id);
        synced += 1;
      } else if (response.status === 400 || response.status === 422) {
        // Invalid entries should not loop forever. Auth failures are retained for the next login.
        await db.delete("pendingTransactions", transaction.id);
      } else {
        break;
      }
    } catch {
      break;
    }
  }

  return synced;
}

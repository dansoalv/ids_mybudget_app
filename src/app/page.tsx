import { Dashboard } from "@/features/dashboard/dashboard";
import { initialTransactions, sharedBalances } from "@/features/dashboard/demo-data";
import { requireUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { toTransaction } from "@/lib/transactions";
import type { SharedBalance } from "@/types/finance";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  if (!isSupabaseConfigured()) {
    return (
      <Dashboard
        initialTransactions={initialTransactions}
        initialSharedBalances={sharedBalances}
        user={{ displayName: "Daniel Sánchez", initials: "DS" }}
        dataMode="demo"
      />
    );
  }

  const { supabase, user } = await requireUser();
  await supabase.rpc("materialize_due_recurring_transactions");

  const [profileResult, transactionResult, groupResult, balanceResult] = await Promise.all([
    supabase.from("profiles").select("display_name").eq("id", user.id).single(),
    supabase.from("transactions").select("*").order("occurred_at", { ascending: false }).limit(50),
    supabase.from("groups").select("id,name").is("archived_at", null),
    supabase.from("group_member_balances").select("group_id,user_id,balance_cents").eq("user_id", user.id),
  ]);

  const groups = groupResult.data ?? [];
  const groupNames = new Map(groups.map((group) => [group.id, group.name]));
  const transactions = (transactionResult.data ?? []).map((row) =>
    toTransaction(row, row.group_id ? groupNames.get(row.group_id) : undefined),
  );
  const balances: SharedBalance[] = (balanceResult.data ?? [])
    .filter((balance) => balance.group_id && balance.balance_cents !== null && balance.balance_cents !== 0)
    .map((balance) => ({
      id: `${balance.group_id}-${user.id}`,
      groupName: groupNames.get(balance.group_id!) ?? "Grupo",
      memberName: "Saldo del grupo",
      amountCents: Math.abs(balance.balance_cents ?? 0),
      direction: (balance.balance_cents ?? 0) > 0 ? "owed_to_you" : "you_owe",
    }));

  const displayName = profileResult.data?.display_name ?? user.email?.split("@")[0] ?? "Usuario";
  const initials = displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <Dashboard
      initialTransactions={transactions}
      initialSharedBalances={balances}
      user={{ displayName, initials }}
      dataMode="live"
    />
  );
}

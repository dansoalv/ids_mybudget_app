import { NextResponse } from "next/server";

import { readBillingAccess } from "@/lib/billing/entitlements";
import { createClient } from "@/lib/supabase/server";

const categoryLabels: Record<string, string> = {
  food: "Alimentos",
  home: "Hogar",
  transport: "Transporte",
  entertainment: "Ocio",
  salary: "Ingresos",
  other: "Otros",
};

export async function GET() {
  const supabase = await createClient();
  const { data: claimsData, error: authError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (authError || !userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const access = await readBillingAccess(supabase, userId);
  if (!access.hasPlus) {
    return NextResponse.json({ error: "La exportación necesita el plan Plus" }, { status: 403 });
  }

  const transactionResult = await supabase
    .from("transactions")
    .select("*")
    .eq("owner_id", userId)
    .is("group_id", null)
    .order("occurred_at", { ascending: false })
    .limit(5_000);

  if (transactionResult.error) {
    return NextResponse.json({ error: "No se pudieron exportar los movimientos" }, { status: 500 });
  }

  const rows = [
    ["Fecha", "Tipo", "Concepto", "Categoría", "Importe", "Moneda"],
    ...(transactionResult.data ?? []).map((transaction) => [
      transaction.occurred_at.slice(0, 10),
      transaction.kind === "income" ? "Ingreso" : "Gasto",
      transaction.title,
      categoryLabels[transaction.category] ?? transaction.category,
      (transaction.amount_cents / 100).toFixed(2),
      transaction.currency,
    ]),
  ];
  const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}`;
  const filename = `mybudget-movimientos-${new Date().toISOString().slice(0, 10)}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}

function csvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

import { NextResponse } from "next/server";

import { persistedTransactionSchema } from "@/features/transactions/schemas";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const parsed = persistedTransactionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Movimiento inválido", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const transaction = parsed.data;
  const { data, error } = await supabase
    .from("transactions")
    .insert({
      id: transaction.id,
      owner_id: user.id,
      created_by: user.id,
      kind: transaction.type,
      title: transaction.title,
      category: transaction.category,
      amount_cents: transaction.amountCents,
      currency: "MXN",
      occurred_at: transaction.occurredAt,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "El movimiento ya existe" }, { status: 409 });
    }

    return NextResponse.json({ error: "No se pudo guardar el movimiento" }, { status: 500 });
  }

  return NextResponse.json({ transaction: data }, { status: 201 });
}

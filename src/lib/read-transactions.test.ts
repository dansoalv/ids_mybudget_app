import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  eq,
  from,
  is,
  isSupabaseConfigured,
  limit,
  order,
  requireUser,
  rpc,
  select,
} = vi.hoisted(() => ({
  eq: vi.fn(),
  from: vi.fn(),
  is: vi.fn(),
  isSupabaseConfigured: vi.fn(),
  limit: vi.fn(),
  order: vi.fn(),
  requireUser: vi.fn(),
  rpc: vi.fn(),
  select: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth", () => ({ requireUser }));
vi.mock("@/lib/supabase/config", () => ({ isSupabaseConfigured }));

import { readPersonalTransactions } from "./read-transactions";

describe("readPersonalTransactions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const builder = { eq, is, limit, order, select };
    eq.mockReturnValue(builder);
    is.mockReturnValue(builder);
    order.mockReturnValue(builder);
    select.mockReturnValue(builder);
    from.mockReturnValue(builder);
    rpc.mockResolvedValue({ error: null });
    requireUser.mockResolvedValue({
      supabase: { from, rpc },
      user: { id: "f76642c1-64db-4dd1-8b42-5ba89092b63f" },
    });
  });

  it("consulta únicamente movimientos personales del usuario autenticado", async () => {
    isSupabaseConfigured.mockReturnValue(true);
    limit.mockResolvedValue({
      data: [
        {
          id: "0d1a8499-a6d0-457b-89a5-2dc538523248",
          owner_id: "f76642c1-64db-4dd1-8b42-5ba89092b63f",
          group_id: null,
          title: "Supermercado",
          amount_cents: 82550,
          currency: "MXN",
          kind: "expense",
          category: "food",
          occurred_at: "2026-11-25T12:00:00.000Z",
        },
      ],
      error: null,
    });

    const result = await readPersonalTransactions();

    expect(from).toHaveBeenCalledWith("transactions");
    expect(eq).toHaveBeenCalledWith(
      "owner_id",
      "f76642c1-64db-4dd1-8b42-5ba89092b63f",
    );
    expect(is).toHaveBeenCalledWith("group_id", null);
    expect(result.transactions).toEqual([
      expect.objectContaining({
        id: "0d1a8499-a6d0-457b-89a5-2dc538523248",
        scope: "personal",
      }),
    ]);
  });

  it("mantiene la demostración limitada a la cuenta personal", async () => {
    isSupabaseConfigured.mockReturnValue(false);

    const result = await readPersonalTransactions();

    expect(result.mode).toBe("demo");
    expect(result.transactions.length).toBeGreaterThan(0);
    expect(result.transactions.every((transaction) => transaction.scope === "personal")).toBe(true);
    expect(requireUser).not.toHaveBeenCalled();
  });
});

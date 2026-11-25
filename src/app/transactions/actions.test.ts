import { beforeEach, describe, expect, it, vi } from "vitest";

const { deleteRow, eq, from, is, maybeSingle, redirect, requireUser, select, update } = vi.hoisted(() => ({
  deleteRow: vi.fn(),
  eq: vi.fn(),
  from: vi.fn(),
  is: vi.fn(),
  maybeSingle: vi.fn(),
  redirect: vi.fn(),
  requireUser: vi.fn(),
  select: vi.fn(),
  update: vi.fn(),
}));

vi.mock("next/navigation", () => ({ redirect }));
vi.mock("@/lib/auth", () => ({ requireUser }));

import { deletePersonalTransaction, updatePersonalTransaction } from "./actions";

describe("personal transaction actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const builder = { eq, is, select, maybeSingle };
    eq.mockReturnValue(builder);
    is.mockReturnValue(builder);
    select.mockReturnValue(builder);
    maybeSingle.mockResolvedValue({ data: { id: "0d1a8499-a6d0-457b-89a5-2dc538523248" }, error: null });
    update.mockReturnValue(builder);
    deleteRow.mockReturnValue(builder);
    from.mockReturnValue({ update, delete: deleteRow });
    requireUser.mockResolvedValue({
      supabase: { from },
      user: { id: "f76642c1-64db-4dd1-8b42-5ba89092b63f" },
    });
    redirect.mockImplementation((path: string) => {
      throw new Error(`REDIRECT:${path}`);
    });
  });

  it("permite actualizar concepto, importe, categoría y fecha", async () => {
    const formData = new FormData();
    formData.set("id", "0d1a8499-a6d0-457b-89a5-2dc538523248");
    formData.set("title", "Supermercado semanal");
    formData.set("amount", "825.50");
    formData.set("kind", "expense");
    formData.set("category", "food");
    formData.set("occurredOn", "2026-11-25");

    await expect(updatePersonalTransaction(formData)).rejects.toThrow("REDIRECT:/transactions?success=updated");
    expect(update).toHaveBeenCalledWith(expect.objectContaining({
      title: "Supermercado semanal",
      amount_cents: 82_550,
      category: "food",
    }));
  });

  it("elimina únicamente movimientos personales del usuario", async () => {
    const formData = new FormData();
    formData.set("id", "0d1a8499-a6d0-457b-89a5-2dc538523248");

    await expect(deletePersonalTransaction(formData)).rejects.toThrow("REDIRECT:/transactions?success=deleted");
    expect(deleteRow).toHaveBeenCalledOnce();
    expect(is).toHaveBeenCalledWith("group_id", null);
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

const { insert, from, redirect, requireUser, rpc } = vi.hoisted(() => ({
  insert: vi.fn(),
  from: vi.fn(),
  redirect: vi.fn(),
  requireUser: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock("next/navigation", () => ({ redirect }));
vi.mock("@/lib/auth", () => ({ requireUser }));
vi.mock("@/lib/billing/entitlements", () => ({
  readBillingAccess: vi.fn(),
}));

import { createGroup, createSharedExpense } from "./actions";

beforeEach(() => {
  vi.clearAllMocks();
  insert.mockResolvedValue({ error: null });
  rpc.mockResolvedValue({ data: "8bb4050e-744c-4d39-8cda-f16e07f6fb84", error: null });
  from.mockReturnValue({ insert });
  requireUser.mockResolvedValue({
    supabase: { from, rpc },
    user: { id: "07bc5c59-bcf4-4147-a83a-1a6262e0eb23" },
  });
  redirect.mockImplementation((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  });
});

describe("createGroup", () => {
  it("genera el id antes de insertar para no depender de RETURNING con RLS", async () => {
    const formData = new FormData();
    formData.set("name", "Casa");
    formData.set("kind", "household");

    await expect(createGroup(formData)).rejects.toThrow(/^REDIRECT:\/groups\/[0-9a-f-]+$/);

    expect(from).toHaveBeenCalledWith("groups");
    expect(insert).toHaveBeenCalledOnce();
    const insertedGroup = insert.mock.calls[0]?.[0];
    expect(insertedGroup).toMatchObject({
      owner_id: "07bc5c59-bcf4-4147-a83a-1a6262e0eb23",
      name: "Casa",
      kind: "household",
      currency: "MXN",
    });
    expect(insertedGroup.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(redirect).toHaveBeenCalledWith(`/groups/${insertedGroup.id}`);
  });

  it("explica el límite cuando una cuenta Gratis ya tiene un grupo", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    insert.mockResolvedValue({
      error: { code: "P0001", details: null, hint: null, message: "FREE_GROUP_LIMIT" },
    });
    const formData = new FormData();
    formData.set("name", "Viaje");
    formData.set("kind", "trip");

    await expect(createGroup(formData)).rejects.toThrow("REDIRECT:/groups?error=");
    expect(redirect).toHaveBeenCalledWith(
      "/groups?error=Tu%20plan%20Gratis%20incluye%201%20grupo.%20Consulta%20los%20otros%20planes%20en%20tu%20perfil.",
    );
  });
});

describe("createSharedExpense", () => {
  it("divide el gasto sólo entre los integrantes seleccionados", async () => {
    const formData = new FormData();
    formData.set("groupId", "91cdd96f-4f49-40ad-9aac-ff1ac2d1a4e3");
    formData.set("title", "Cena");
    formData.set("amount", "100.01");
    formData.set("category", "food");
    formData.set("paidBy", "07bc5c59-bcf4-4147-a83a-1a6262e0eb23");
    formData.append("participantIds", "07bc5c59-bcf4-4147-a83a-1a6262e0eb23");
    formData.append("participantIds", "705b76dc-3040-456e-902a-a928e2973f51");

    await expect(createSharedExpense(formData)).rejects.toThrow(
      "REDIRECT:/groups/91cdd96f-4f49-40ad-9aac-ff1ac2d1a4e3?success=expense",
    );

    expect(rpc).toHaveBeenCalledWith("create_shared_expense", expect.objectContaining({
      p_splits: [
        { user_id: "07bc5c59-bcf4-4147-a83a-1a6262e0eb23", amount_cents: 5001 },
        { user_id: "705b76dc-3040-456e-902a-a928e2973f51", amount_cents: 5000 },
      ],
    }));
  });

  it("rechaza un gasto sin participantes", async () => {
    const formData = new FormData();
    formData.set("groupId", "91cdd96f-4f49-40ad-9aac-ff1ac2d1a4e3");
    formData.set("title", "Cena");
    formData.set("amount", "100");
    formData.set("category", "food");
    formData.set("paidBy", "07bc5c59-bcf4-4147-a83a-1a6262e0eb23");

    await expect(createSharedExpense(formData)).rejects.toThrow(
      "REDIRECT:/groups/91cdd96f-4f49-40ad-9aac-ff1ac2d1a4e3?error=",
    );
    expect(rpc).not.toHaveBeenCalled();
  });
});

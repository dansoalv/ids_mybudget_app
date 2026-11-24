import { beforeEach, describe, expect, it, vi } from "vitest";

const { insert, from, redirect, requireUser } = vi.hoisted(() => ({
  insert: vi.fn(),
  from: vi.fn(),
  redirect: vi.fn(),
  requireUser: vi.fn(),
}));

vi.mock("next/navigation", () => ({ redirect }));
vi.mock("@/lib/auth", () => ({ requireUser }));

import { createGroup } from "./actions";

describe("createGroup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    insert.mockResolvedValue({ error: null });
    from.mockReturnValue({ insert });
    requireUser.mockResolvedValue({
      supabase: { from },
      user: { id: "07bc5c59-bcf4-4147-a83a-1a6262e0eb23" },
    });
    redirect.mockImplementation((path: string) => {
      throw new Error(`REDIRECT:${path}`);
    });
  });

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
});

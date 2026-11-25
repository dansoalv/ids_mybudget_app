import { describe, expect, it } from "vitest";

import { getAppUrl } from "./app-url";

describe("getAppUrl", () => {
  it("prioriza el dominio público configurado", () => {
    expect(getAppUrl({
      NEXT_PUBLIC_APP_URL: "https://mybudget.inovaceds.com/",
      VERCEL_PROJECT_PRODUCTION_URL: "idsmybudgetapp.vercel.app",
    })).toBe("https://mybudget.inovaceds.com");
  });

  it("no genera enlaces localhost dentro de Vercel", () => {
    expect(getAppUrl({
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
      VERCEL_PROJECT_PRODUCTION_URL: "idsmybudgetapp.vercel.app",
    })).toBe("https://idsmybudgetapp.vercel.app");
  });

  it("conserva localhost durante el desarrollo local", () => {
    expect(getAppUrl({ NEXT_PUBLIC_APP_URL: "http://localhost:3000" })).toBe(
      "http://localhost:3000",
    );
  });
});

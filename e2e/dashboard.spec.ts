import { expect, test } from "@playwright/test";

test("muestra el resumen y registra un movimiento en modo demo", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: /Hola,/ })).toBeVisible();
  await expect(page.getByText("Balance disponible")).toBeVisible();

  await page.getByRole("button", { name: /Nuevo movimiento|Agregar movimiento/ }).first().click();
  await page.getByPlaceholder("0.00").fill("125.50");
  await page.getByPlaceholder("Ej. Supermercado").fill("Prueba E2E");
  await page.getByRole("button", { name: "Guardar movimiento" }).click();

  await expect(page.getByText("Prueba E2E")).toBeVisible();
  await expect(page.getByText("Movimiento registrado en la demostración")).toBeVisible();
});

test("abre la sección de grupos desde la navegación", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /Grupos/ }).first().click();
  await expect(page.getByRole("heading", { name: "Gastos en equipo" })).toBeVisible();
  await expect(page.getByText("Vista demostrativa")).toBeVisible();
});

test("mantiene los controles dentro del viewport móvil", async ({ page }) => {
  const viewport = page.viewportSize();
  test.skip(!viewport || viewport.width >= 640, "Validación exclusiva para layouts móviles");

  await page.goto("/");
  const navigation = page.getByRole("navigation", { name: "Navegación móvil" });
  const navigationBox = await navigation.boundingBox();

  expect(navigationBox).not.toBeNull();
  expect(Math.abs(viewport!.height - navigationBox!.y - navigationBox!.height)).toBeLessThanOrEqual(1);

  await page.getByRole("button", { name: "Agregar movimiento" }).click();
  const concept = page.getByPlaceholder("Ej. Supermercado");
  await concept.focus();
  await expect(concept).toBeInViewport();
  await expect(page.getByRole("button", { name: "Guardar movimiento" })).toBeInViewport();
});

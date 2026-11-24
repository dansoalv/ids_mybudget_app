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
  if ((page.viewportSize()?.width ?? 1024) < 1024) {
    await expect(page.getByRole("navigation", { name: "Navegación móvil" })).toContainText("Perfil");
  }
});

test("muestra la información básica del perfil", async ({ page }) => {
  await page.goto("/profile");

  await expect(page.getByRole("heading", { name: "Daniel Sánchez" })).toBeVisible();
  await expect(page.getByText("daniel@ejemplo.com")).toBeVisible();
  await expect(page.getByText("Moneda principal")).toBeVisible();
  await expect(page.getByText("Español (México)")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Un plan para cada etapa" })).toBeVisible();
  await expect(page.getByText("Plan actual: Gratis")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Plus" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Familia" })).toBeVisible();
  if ((page.viewportSize()?.width ?? 1024) < 1024) {
    await expect(page.getByRole("link", { name: /Perfil/ })).toHaveAttribute("aria-current", "page");
  }
});

test("permite iniciar el flujo de recuperación de contraseña", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("link", { name: "¿Olvidaste tu contraseña?" }).click();

  await expect(page.getByRole("heading", { name: "Recupera tu acceso" })).toBeVisible();
  await page.getByLabel("Correo de tu cuenta").fill("persona@ejemplo.com");
  await page.getByRole("button", { name: "Enviar enlace de recuperación" }).click();
  await expect(page.getByText(/Si existe una cuenta con ese correo/)).toBeVisible();
});

test("consulta los módulos informativos de movimientos y plan", async ({ page }) => {
  await page.goto("/transactions");
  await expect(page.getByRole("heading", { name: "Todo tu mes, en orden" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Historial" })).toBeVisible();
  await expect(page.getByText("Solo consulta")).toBeVisible();

  await page.goto("/plan");
  await expect(page.getByRole("heading", { name: /Una referencia sencilla/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Distribución 50/30/20" })).toBeVisible();
  await expect(page.getByText("Próxima etapa")).toBeVisible();
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

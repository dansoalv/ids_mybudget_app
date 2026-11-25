type AppUrlEnvironment = Partial<Pick<
  NodeJS.ProcessEnv,
  "NEXT_PUBLIC_APP_URL" | "VERCEL_PROJECT_PRODUCTION_URL" | "VERCEL_URL"
>>;

function isLocalUrl(value: string) {
  try {
    const hostname = new URL(value).hostname;
    return hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

export function getAppUrl(environment: AppUrlEnvironment = process.env as AppUrlEnvironment) {
  const configuredUrl = environment.NEXT_PUBLIC_APP_URL?.trim();
  const vercelHost = (
    environment.VERCEL_PROJECT_PRODUCTION_URL ?? environment.VERCEL_URL
  )?.trim();

  // Evita publicar enlaces localhost cuando Vercel sí conoce el dominio del despliegue.
  if (configuredUrl && !(vercelHost && isLocalUrl(configuredUrl))) {
    return new URL(configuredUrl).origin;
  }

  if (vercelHost) return new URL(`https://${vercelHost}`).origin;
  return new URL(configuredUrl || "http://localhost:3000").origin;
}

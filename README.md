# MyBudget

PWA mobile-first para registrar finanzas personales y coordinar gastos en pareja o con grupos.

## Desarrollo local

Requisitos:

- Node.js 24 LTS
- npm 11+

```bash
npm install
npm run typecheck
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`.

## Comandos

- `npm run dev`: entorno de desarrollo.
- `npm run build`: compilación de producción.
- `npm run lint`: análisis estático.
- `npm run typecheck`: validación de TypeScript.
- `npm run test`: pruebas unitarias.
- `npm run test:e2e`: pruebas de navegador con Playwright.
- `npm run db:start`: levanta Supabase local (requiere Docker).
- `npm run db:test`: ejecuta las pruebas pgTAP de esquema y RLS.

## Supabase

Copia `.env.example` a `.env.local` y añade la URL y la clave publicable de tu proyecto. Sin estas variables la app abre un modo demostración; con ellas activa Auth, PostgreSQL, RLS, grupos, invitaciones, gastos divididos y liquidaciones.

```bash
cp .env.example .env.local
npm run db:start
npm run db:reset
```

La migración inicial está en `supabase/migrations/` y las pruebas de base de datos en `supabase/tests/`.

## Arquitectura

El código vive en `src/` y se organiza por responsabilidades:

- `app/`: rutas y composición de páginas.
- `components/`: componentes visuales reutilizables.
- `features/`: funcionalidades del producto.
- `lib/`: utilidades transversales.
- `types/`: contratos compartidos.

Consulta [`docs/architecture.md`](docs/architecture.md) para las decisiones técnicas y [`docs/deployment.md`](docs/deployment.md) para publicar la beta privada.

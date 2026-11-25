# Configuración de Stripe para MyBudget

La integración usa Stripe Checkout para altas, Customer Portal para administración y webhooks firmados para sincronizar los beneficios en Supabase. MyBudget nunca almacena datos de tarjetas.

## 1. Aplicar la migración

Ejecuta las migraciones de Supabase antes de activar Checkout:

```bash
supabase db push
```

La migración `20261124230000_stripe_billing.sql` añade identificadores de Stripe, periodicidad, prueba, periodo de gracia, cancelación al finalizar e idempotencia de webhooks.

## 2. Crear productos, precios y promoción

En Stripe activa **Test mode**, copia la Secret key y ejecútalo solo localmente:

```bash
STRIPE_SECRET_KEY=sk_test_... npm run stripe:setup
```

El script es idempotente y crea:

- Plus mensual: $59 MXN.
- Plus anual: $590 MXN.
- Familia mensual: $99 MXN.
- Familia anual: $990 MXN.
- Código `FUNDADOR20`: 20% durante tres meses, solo para la primera compra y limitado a 100 usos. En un plan anual se aplica al primer cobro.

Copia los cuatro Price IDs que imprime el script a `.env.local` y a Vercel.

## 3. Configurar el webhook

En Stripe Developers > Webhooks registra:

```text
https://mybudget.inovaceds.com/api/stripe/webhook
```

Eventos requeridos:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `customer.subscription.paused`
- `customer.subscription.resumed`

Copia el Signing secret como `STRIPE_WEBHOOK_SECRET`.

Para desarrollo local puedes utilizar Stripe CLI:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

## 4. Configurar Customer Portal

En Settings > Billing > Customer portal habilita:

- Actualización del método de pago.
- Historial de facturas.
- Cancelación al finalizar el periodo.
- Cambio entre los cuatro Price IDs de MyBudget.

## 5. Variables de Vercel

Configura todas las variables en Production, Preview y Development. `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY` y `STRIPE_WEBHOOK_SECRET` son exclusivamente del servidor y nunca deben llevar el prefijo `NEXT_PUBLIC_`.

Mantén claves `sk_test_` mientras las funciones Plus y Familia estén en validación. Sustituye productos, Price IDs, webhook y claves por sus equivalentes Live únicamente al comenzar a cobrar dinero real.


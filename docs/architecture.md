# Arquitectura de MyBudget

## Objetivos

- Experiencia mobile-first que permita registrar un movimiento en menos de diez segundos.
- Separación estricta entre información personal y espacios compartidos.
- Dominio independiente del proveedor de persistencia.
- Accesibilidad, pruebas y observabilidad desde el inicio.
- Evolución progresiva de PWA a aplicaciones instalables sin duplicar la lógica del negocio.

## Capas

### Presentación

Next.js App Router compone las rutas. Los componentes visuales reciben datos tipados y no acceden directamente a la base de datos.

### Funcionalidades

Cada módulo en `features/` agrupa sus componentes, casos de uso, validaciones y adaptadores. Los primeros módulos serán:

- `transactions`: ingresos y gastos personales.
- `groups`: hogares, viajes y grupos compartidos.
- `balances`: divisiones, saldos y liquidaciones.
- `dashboard`: resumen mensual.

### Dominio

Los contratos y reglas monetarias no dependen de React ni de Supabase. Los importes se representan como enteros en centavos y cada registro lleva una moneda ISO 4217.

### Datos

Supabase aporta PostgreSQL, Auth y sesiones basadas en cookies. La interfaz conserva un modo demostración cuando no hay variables de entorno; al configurarlas, los movimientos y espacios compartidos se leen con el usuario autenticado y RLS.

## Seguridad

- Row Level Security en todas las tablas expuestas y vista de saldos con `security_invoker`.
- Acceso personal por `user_id`.
- Acceso compartido mediante membresías activas.
- Invitaciones con tokens de un solo uso y vencimiento.
- La aplicación no necesita una clave administrativa: usa la clave publicable y la sesión del usuario.
- Pruebas pgTAP verifican el esquema y la activación de RLS en CI.

## Decisiones del MVP

- Mercado inicial: México.
- Moneda inicial: MXN.
- Registro manual, sin conexión bancaria.
- Un gasto compartido tiene un pagador y una o más divisiones.
- Una liquidación compensa saldos; nunca elimina el historial.
- Gastos personales privados por defecto.

## Ruta de entrega

1. Vertical slice navegable con datos de demostración. ✅
2. Supabase Auth, PostgreSQL y Row Level Security. ✅
3. Movimientos personales, grupos, invitaciones, divisiones y liquidaciones. ✅
4. Cola offline para movimientos personales y shell PWA. ✅
5. Beta privada, observabilidad, métricas de producto y suscripciones.

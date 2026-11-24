# Despliegue de la beta privada

## 1. Crear el proyecto de Supabase

1. Crea un proyecto en Supabase en una región cercana a los usuarios iniciales.
2. En Authentication, habilita correo y contraseña y exige confirmación de correo.
3. Configura `Site URL` con la URL de producción y añade `http://localhost:3000/auth/callback` para desarrollo.
   Si personalizas la plantilla de confirmación con `token_hash`, dirígela a `/auth/confirm`; la app admite tanto PKCE (`/auth/callback`) como OTP (`/auth/confirm`).
4. Instala Supabase CLI, inicia sesión y enlaza este repositorio:

```bash
npx supabase login
npx supabase link --project-ref TU_PROJECT_REF
npx supabase db push
```

No uses la `service_role` en el navegador. La aplicación funciona con la clave publicable y las políticas RLS.

## 2. Variables de entorno

Configura localmente y en el proveedor de hosting:

```dotenv
NEXT_PUBLIC_APP_URL=https://beta.tudominio.com
NEXT_PUBLIC_SUPABASE_URL=https://TU_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

## 3. Desplegar la PWA

Vercel es la ruta más directa para este proyecto Next.js:

1. Importa el repositorio de GitHub.
2. Añade las tres variables anteriores para Production y Preview.
3. Ejecuta el primer despliegue.
4. Actualiza en Supabase la `Site URL` y las URLs permitidas con el dominio definitivo.

## 4. Restringir la beta

Para la primera beta, desactiva `Allow new users to sign up` después de crear las cuentas de los participantes o usa una lista de invitación. No dependas de una URL difícil de adivinar como mecanismo de acceso.

## 5. Lista de verificación

- El workflow CI termina en verde.
- Las migraciones remotas coinciden con el repositorio.
- Registro, confirmación, inicio y cierre de sesión funcionan.
- Dos cuentas pueden compartir un grupo, dividir un gasto y registrar una liquidación.
- La PWA abre la pantalla offline y sincroniza un movimiento personal al reconectarse.
- No hay claves administrativas en el bundle ni en el historial de Git.
- Se han configurado backups, alertas de errores y un canal de feedback para beta testers.

# Fusiona Real Estate

Catálogo digital de propiedades (sitio cliente + panel admin) para Fusiona Real Estate — Toluca, Metepec, San Mateo Atenco y Calimaya.

## Stack

- **Frontend:** Vite + React + TypeScript + Tailwind CSS + React Router, desplegado en **Cloudflare Pages**.
- **Server logic:** Cloudflare Pages Functions (`/functions/api`) — notificación por correo de visitas y disponibilidad/creación de eventos en Google Calendar.
- **Backend:** Supabase (Postgres + Auth + Storage).
- **WhatsApp:** deep link `wa.me` (sin API de pago).

## Estructura

```
src/
  i18n/            diccionarios ES/EN y contexto de idioma
  lib/             supabase client, whatsapp, formato, storage, fechas
  components/      componentes compartidos (header, cards, sheet de visita, auth)
  pages/client/    sitio público: Home (catálogo) y PropertyDetail (ficha + galería por áreas)
  pages/admin/     panel privado: login, dashboard, alta/edición de propiedad, claves por municipio, visitas
  types/database.ts tipos de las tablas de Supabase
functions/api/     Cloudflare Pages Functions (notify-visit, calendar/availability)
supabase/migrations/  esquema SQL, folios automáticos, RLS, buckets, limpieza de INE
```

## Puesta en marcha

### 1. Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. En el SQL Editor, ejecuta en orden los archivos de `supabase/migrations/` (0001 → 0006).
   - `0006_retention_cleanup.sql` requiere las extensiones `pg_cron` y `pg_net` (actívalas en *Database → Extensions*) y dos secretos en Vault (*Database → Vault*): `project_url` y `service_role_key`. Si no las configuras, el job de limpieza simplemente no hace nada (no falla).
3. Crea un usuario administrador en *Authentication → Users* (correo/contraseña) — ese es el login del panel `/admin`.
4. (Opcional) Ejecuta `supabase/seed.sql` para cargar propiedades de ejemplo.
5. Copia la URL del proyecto y el `anon key` (*Settings → API*) a tu `.env`.

### 2. Variables de entorno

```bash
cp .env.example .env
# rellena VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_WHATSAPP_NUMBER
```

Las variables del lado servidor (envío de correo y Google Calendar) se configuran como **secrets** de Cloudflare Pages, nunca en `.env` del frontend — ver la lista completa en `wrangler.toml`.

### 3. Desarrollo local

```bash
npm install
npm run dev
```

Para probar las Pages Functions localmente (correo/calendario):

```bash
npm run build
npm run pages:dev
```

### 4. Despliegue (Cloudflare Pages)

1. Conecta el repositorio en el dashboard de Cloudflare Pages.
2. Build command: `npm run build` · Output directory: `dist`.
3. Configura las variables de entorno (cliente `VITE_*` y secrets de servidor) en *Settings → Environment variables*.
4. Cada push a la rama configurada despliega automáticamente.

## Integraciones externas — qué falta configurar

- **Google Calendar:** crea una cuenta de servicio en Google Cloud, comparte tu calendario con su correo (permiso "Realizar cambios en los eventos"), y define `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` y `GOOGLE_CALENDAR_ID` como secrets. Sin esto, el flujo de agendar visita sigue funcionando con horarios fijos (10:00, 12:00, 16:00, 18:00) y la cita queda "pendiente" para confirmar manualmente.
- **Correo (Resend):** crea una cuenta en [resend.com](https://resend.com), verifica un dominio/remitente, y define `RESEND_API_KEY`, `NOTIFY_EMAIL_FROM`, `NOTIFY_EMAIL_TO`. Sin esto, las solicitudes de visita se guardan igual en Supabase, simplemente no se envía el correo de aviso.
- **WhatsApp:** ya apunta a `+52 1 722 683 0208` vía `VITE_WHATSAPP_NUMBER`.

## Cómo funciona la clave (folio) de cada propiedad

Al insertar una propiedad sin folio, un trigger en Postgres (`generate_property_folio`, ver `0002_folio_generation.sql`) calcula `{código}{V|R}-{consecutivo}` usando la tabla `municipality_codes` (editable desde `/admin/ajustes`) y un contador independiente por combinación código+modalidad (`folio_counters`). Ejemplo: Toluca = `T`, venta = `V` → `TV-1`, `TV-2`, …

## Seguridad de datos sensibles (INE)

- Las fotos de identificación se suben directo desde el navegador al bucket privado `ine-uploads` (política de Storage: el público solo puede **insertar**, nunca leer/listar).
- Solo el panel admin (autenticado) puede generarlas como URLs firmadas de corta duración (120 s) para visualizarlas, o el correo de notificación incluye enlaces firmados de 7 días.
- `cleanup_expired_ine_uploads` (pg_cron, diario) borra las imágenes de Storage y limpia las rutas en `visit_requests` 7 días después de que una cita se confirma/cancela, o 30 días si quedó sin resolver.

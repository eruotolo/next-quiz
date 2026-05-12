# Despliegue automatizado en Netlify

## Resumen

Este proyecto usa Netlify + Neon (PostgreSQL serverless) como stack de producción.
El build ejecuta automáticamente migraciones y seed en cada deploy.

---

## Stack de producción

| Servicio | Proveedor | Notas |
|---|---|---|
| Hosting / Build | Netlify | Plugin @netlify/plugin-nextjs v5 |
| Base de datos | Neon (neon.tech) | PostgreSQL serverless, free tier |
| Autenticación admin | NextAuth v5 | Requiere AUTH_SECRET y AUTH_URL |
| Sesiones estudiantes | jose (JWT) | Requiere STUDENT_SESSION_SECRET |

---

## Configuración inicial (una sola vez)

### 1. Crear base de datos en Neon

1. Crear cuenta gratuita en [neon.tech](https://neon.tech)
2. New project → elegir región más cercana (por ej. US East)
3. Copiar la **Connection string** de la pestaña "Connection Details"
4. Usar la URL en formato pooled (con pgBouncer): pestaña "Connection pooling"

La URL tiene esta forma:
```
postgresql://user:password@ep-xxx.us-east-1.neon.tech/dbname?sslmode=require
```

Para agregar parámetros de pooling:
```
postgresql://user:password@ep-xxx.us-east-1.neon.tech/dbname?pgbouncer=true&connect_timeout=15&sslmode=require
```

### 2. Generar secrets

```bash
# AUTH_SECRET
openssl rand -base64 32

# STUDENT_SESSION_SECRET
openssl rand -base64 32
```

### 3. Variables de entorno en Netlify

En Netlify → Site configuration → Environment variables → Add variable:

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | URL de conexión Neon con pooling |
| `AUTH_SECRET` | Secret generado con openssl (paso anterior) |
| `AUTH_URL` | URL del sitio en Netlify, ej: `https://mi-sitio.netlify.app` |
| `STUDENT_SESSION_SECRET` | Secret generado con openssl (paso anterior) |

> **Importante:** `AUTH_URL` debe coincidir exactamente con el dominio de producción.

### 4. Conectar repositorio a Netlify

1. Subir el proyecto a GitHub: `git push origin main`
2. En [app.netlify.com](https://app.netlify.com): Add new site → Import from Git
3. Seleccionar el repositorio
4. Netlify detectará automáticamente el `netlify.toml`
5. Agregar las variables de entorno ANTES de hacer el primer deploy
6. Click en "Deploy site"

---

## Flujo de build automático

Cada push a `main` ejecuta en orden:

```
prisma generate         → genera Prisma Client
prisma migrate deploy   → aplica migraciones (sin interactividad)
pnpm db:seed            → ejecuta prisma/seed.ts con tsx (usa upsert, es idempotente)
next build              → compila la aplicación Next.js
```

El seed es **idempotente**: usa `upsert` en todas las entidades, por lo que re-ejecutarlo en cada deploy no duplica datos.

---

## Acceso inicial

Una vez desplegado:

| Ruta | Usuario |
|---|---|
| `/admin/login` | edgardo.ruotolo@ulagos.cl |

Examen demo disponible: **"Examen demo — Conocimientos generales"** (grupo: 4to Año B)

---

## Archivos de configuración creados

| Archivo | Descripción |
|---|---|
| `netlify.toml` | Configuración de build, publish dir y plugin |
| `package.json` devDependencies | `@netlify/plugin-nextjs ^5.15.11` |

---

## Consideraciones

- **Next.js 16:** Si el plugin de Netlify no soporta Next.js 16 al momento del deploy, revisar los build logs. Alternativa: actualizar `@netlify/plugin-nextjs` a la versión más reciente con `pnpm update @netlify/plugin-nextjs`.
- **Cold starts Neon:** En el free tier, la DB hiberna tras 5 min de inactividad. El primer request será lento (~1-2s extra). Para producción real, considerar upgrade a Neon Launch ($19/mes).
- **AUTH_URL:** Si se configura un dominio personalizado en Netlify, actualizar esta variable en el panel.

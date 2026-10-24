# Lernze

Plataforma para que creadores vendan programas (clases y comunidad), con un Discover feed de trailers y agentes que publican clips en sus redes.

Next.js 16 (App Router, Cache Components) + TypeScript + Tailwind 4. Base de datos prevista: Supabase.

## Correr en local

```bash
npm install
npm run dev
```

## Conectar Supabase

El proyecto `lernze` ya existe (us-east-1) con las migraciones 0001 y 0002 aplicadas, y `.env.local` apunta a él. Para otro entorno, estos son los pasos:

1. En supabase.com crea un proyecto (el plan gratuito basta) y espera a que termine de crearse.
2. **SQL Editor**: ejecuta en orden los archivos de `supabase/migrations/`.
3. **Project Settings > API**: copia la *Project URL* y la clave *publishable* (o *anon*).
4. Copia `.env.example` a `.env.local` y completa `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
5. **Authentication > URL Configuration**: en *Site URL* pon `http://localhost:3000` (o el puerto que uses) y en *Redirect URLs* agrega `http://localhost:3000/auth/callback`.
6. Para probar rápido, en **Authentication > Providers > Email** desactiva *Confirm email*. Actívalo de nuevo antes de lanzar.
7. Reinicia `npm run dev`. Sin esas variables la app vuelve sola al modo demo.

## Estado

- **Hecho:** marca (tinta + ámbar), Discover feed con intereses por URL (`/?i=Negocios,Marketing`), página de programa con compra simulada que registra el origen de la venta (`?src=discover|agent`), formulario para crear curso.
- **Cuentas:** registro, inicio de sesión y cierre de sesión con Supabase Auth. `/crear` exige sesión y comprar un programa también.
- **Modo demo:** sin variables de Supabase los datos viven en memoria (`src/lib/data-demo.ts`) y no hay cuentas. No hay cobros reales en ningún modo.
- **Esquema:** `supabase/migrations/` (perfiles, programas, inscripciones con RLS y contador de miembros). Con las variables puestas, `src/lib/data.ts` usa la base real.

## Vocabulario

La interfaz llama **programa** a lo que vende un creador y **clases** a sus lecciones. La palabra vive en `src/lib/copy.ts`; el código y la base de datos siguen usando `course`. La ruta pública es `/programa/[slug]`.

## Modelo de cobro (`src/lib/pricing.ts`)

| Origen de la venta | Comisión |
|---|---|
| Tráfico propio | 0% |
| Clip de agente | 3% |
| Discover | 5% |

Suscripción de agentes: $49 al mes, hasta 20 clips.

## Siguiente

1. Subida de trailer y generación del trailer con IA.
2. Cobros con Stripe Connect en modo de prueba.
3. Classroom, comunidad y panel del creador.

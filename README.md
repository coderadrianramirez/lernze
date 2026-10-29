# Lernze

Plataforma para que creadores vendan programas (clases y comunidad), con un Discover feed de trailers y agentes que publican clips en sus redes.

Next.js 16 (App Router, Cache Components) + TypeScript + Tailwind 4. Base de datos prevista: Supabase.

## Correr en local

```bash
npm install
npm run dev
```

## Conectar Supabase

El proyecto `lernze` ya existe (us-east-1) con las migraciones 0001 a 0005 aplicadas, y `.env.local` apunta a él. **Pendiente:** ejecutar `0006_course_views.sql` (historial de vistas); hasta entonces la app no guarda visitas y oculta "Vistos recientemente" sin dar error. Para otro entorno, estos son los pasos:

1. En supabase.com crea un proyecto (el plan gratuito basta) y espera a que termine de crearse.
2. **SQL Editor**: ejecuta en orden los archivos de `supabase/migrations/`.
3. **Project Settings > API**: copia la *Project URL* y la clave *publishable* (o *anon*).
4. Copia `.env.example` a `.env.local` y completa `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
5. **Authentication > URL Configuration**: en *Site URL* pon `http://localhost:3000` (o el puerto que uses) y en *Redirect URLs* agrega `http://localhost:3000/auth/callback`.
6. Para probar rápido, en **Authentication > Providers > Email** desactiva *Confirm email*. Actívalo de nuevo antes de lanzar.
7. Reinicia `npm run dev`. Sin esas variables la app vuelve sola al modo demo.

## Estado

- **Hecho:** marca (tinta + ámbar), Discover feed con intereses por URL (`/?i=Negocios,Marketing`), página de programa con compra simulada que registra el origen de la venta (`?src=discover|agent`), formulario para crear curso.
- **Descubrir:** navbar con categorías, hero rotativo, filas con tooltip "¿Por qué ves esto?", grilla "Por menos de $100" y página `/ofertas` por categoría.
- **Recomendaciones:** onboarding de intereses (`/bienvenida`, editable desde Mi cuenta), filas "Para ti" y "Porque te interesa X", y con el historial de vistas "Vistos recientemente", "Porque viste X" e intereses deducidos de lo visto.
- **Búsqueda:** `/buscar`, en vivo y sin importar acentos (`src/lib/search.ts`).
- **Mi cuenta (`/dashboard`):** perfil, intereses, programas a los que te uniste, vistos recientemente, programas publicados y ajustes.
- **Móvil:** experiencia tipo app con header compacto, barra de pestañas inferior, hoja de detalle y manifiesto para instalarla. Cada página oculta la barra con `<NoTabBar />` o muestra el footer con `<ShowFooterOnMobile />`.
- **Footer:** newsletter (tabla `newsletter_subscribers`, solo inserción) y páginas legales provisorias en `/legal/*`.
- **Cuentas:** registro, inicio de sesión y cierre de sesión con Supabase Auth. `/crear` exige sesión y comprar un programa también.
- **Modo demo:** sin variables de Supabase los datos viven en memoria (`src/lib/data-demo.ts`) y no hay cuentas. No hay cobros reales en ningún modo.
- **Esquema:** `supabase/migrations/` (perfiles, programas, inscripciones con RLS y contador de miembros). Con las variables puestas, `src/lib/data.ts` usa la base real.

## Vocabulario

La interfaz llama **programa** a lo que vende un creador y **clases** a sus lecciones. La palabra vive en `src/lib/copy.ts`; el código y la base de datos siguen usando `course`. La ruta pública es `/programa/[slug]`.

## Portadas y trailers

Cada programa se dibuja como una portada ilustrada (`src/lib/art.ts`, datos en la columna `art`) y tiene un trailer: un video en `trailer_url` o, si falta, un trailer animado con las cinco frases de `scenes`. Al pasar el mouse sobre una portada se abre una tarjeta ampliada que reproduce el trailer.

- **Programas de ejemplo:** `src/lib/demo-programs.ts` (modo demo y SQL de carga). En la base se cargan con `supabase/seed/demo_programs.sql` y llevan `demo = true`. Para quitarlos: `delete from public.courses where demo;`.
- **Videos de prueba:** se graban con Chrome y se codifican con las librerías de macOS, sin instalar nada.
  1. `ENABLE_RENDER=1 npm run build && ENABLE_RENDER=1 PORT=3200 npm run start`
  2. `node scripts/render-trailers.mjs http://127.0.0.1:3200 /tmp/lz-frames`
  3. `swiftc -O scripts/encode.swift -o /tmp/lz-encode && /tmp/lz-encode /tmp/lz-frames/<slug> 24 <slug>.mp4`
  4. Se suben al bucket `trailers` dentro de la carpeta del usuario (`trailers/<id>/<slug>.mp4`), como lo harán los creadores.
  La ruta `/render/<slug>` solo existe con `ENABLE_RENDER=1`; en producción responde 404.

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
3. Classroom, comunidad y panel del creador (métricas de sus programas).
4. Textos legales definitivos y direcciones reales de redes sociales (`SOCIAL` en `src/components/Footer.tsx`).

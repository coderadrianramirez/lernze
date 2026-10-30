# Lernze

Plataforma para que creadores vendan programas (clases y comunidad), con un Discover feed de trailers y agentes que publican clips en sus redes.

Next.js 16 (App Router, Cache Components) + TypeScript + Tailwind 4. Base de datos prevista: Supabase.

## Correr en local

```bash
npm install
npm run dev
```

## Conectar Supabase

El proyecto `lernze` ya existe (us-east-1) con las migraciones 0001 a 0011 aplicadas, y `.env.local` apunta a él. Para otro entorno, estos son los pasos:

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
- **Mi cuenta (`/dashboard`):** perfil, programas a los que te uniste, vistos recientemente y programas propios. Configuración tiene su propia página.
- **Móvil:** experiencia tipo app con header compacto, barra de pestañas inferior, hoja de detalle y manifiesto para instalarla. Cada página oculta la barra con `<NoTabBar />` o muestra el footer con `<ShowFooterOnMobile />`.
- **Programas como cursos:** el creador sube su trailer en `/crear` y gestiona las clases en `/programa/<slug>/clases` (subir video, ordenar, editar, marcar vista previa). Quien se une va al aula `/aprender/<slug>`: reproductor, lista de clases, siguiente clase al terminar y progreso. La página del programa muestra el temario con candados.
- **Videos:** suben directo del navegador a Supabase Storage con un permiso firmado (`src/app/actions/upload.ts`, `src/components/VideoUpload.tsx`). Trailers en el bucket público `trailers`; clases en el bucket privado `lessons`, servidas con enlaces firmados de 3 horas solo a inscritos, al creador y, en vista previa, a cualquiera. Límite del plan gratuito de Supabase: 50 MB por archivo.
- **Footer:** newsletter (tabla `newsletter_subscribers`, solo inserción) y páginas legales provisorias en `/legal/*`.
- **Cuentas:** registro, inicio de sesión y cierre de sesión con Supabase Auth. `/crear` exige sesión y comprar un programa también.
- **Modo demo:** sin variables de Supabase los datos viven en memoria (`src/lib/data-demo.ts`) y no hay cuentas. No hay cobros reales en ningún modo.
- **Esquema:** `supabase/migrations/` (perfiles, programas, inscripciones con RLS y contador de miembros). Con las variables puestas, `src/lib/data.ts` usa la base real.

## Borradores, edición y publicación

- Un programa nuevo se guarda como borrador privado. En Mi cuenta → Enseñar → Gestionar, el creador recorre Información → Clases → Publicación.
- Puede editar título, descripción, nombre público, categoría, precio y trailer. Cambiar el título conserva el enlace y la ilustración.
- Para publicar: descripción de al menos 20 caracteres, una clase como mínimo y videos subidos para todas las clases. El trailer propio es opcional: puede usar la animación.
- Retirar del catálogo impide nuevas inscripciones y oculta las vistas previas públicas; los alumnos existentes conservan sus clases y progreso. Se puede volver a publicar. Las clases de un programa publicado deben tener video y no se puede borrar la última.
- **Activada el 2026-10-30:** `supabase/migrations/0008_program_publication.sql` aplicada en el proyecto Lernze con autorización del usuario. Publicar y retirar ya están disponibles. Se verificaron las funciones, políticas y triggers; los 17 programas conservaron su estado y sus precios. La migración admite el nombre histórico sin tilde de la política de catálogo.
- Las inscripciones y los ingresos siguen siendo simulados. No se implementaron cobros ni funciones de comunidad en este bloque.

### Control del contenido y configuración

- Portadas del trailer y de cada clase: ilustración automática, fotograma del video o imagen propia. Conservan la composición de Lernze, con título, color, encuadre y vista previa horizontal/vertical. Los fotogramas externos requieren que el servidor del video permita CORS; siempre queda la opción de subir una imagen.
- Cancelar creación no crea un programa; cancelar una edición conserva lo guardado. Se limpian las subidas nuevas sin guardar. Cada clase permite reemplazar o quitar su video; un programa publicado mantiene las protecciones de contenido de 0008.
- Eliminar programa pide confirmación explícita y advierte que los alumnos perderán acceso. Elimina clases, inscripciones y progreso por cascada, y después limpia los archivos propios sin referencias. Retirar del catálogo sigue conservando el acceso de alumnos. Los enlaces externos no se eliminan del proveedor original.
- El menú ofrece Mi cuenta → Configuración → Crear programa. Se quitó el bloque Cuenta del dashboard; los enlaces legales permanecen en el footer, visible también en Configuración móvil.
- Configuración (/configuracion): subir/quitar foto, nombre público en todos los programas y búsqueda, intereses, cambio de correo con confirmación de Supabase y cambio de contraseña con verificación. No se modificaron correos ni contraseñas reales durante las pruebas.
- **Activadas el 2026-10-30 con autorización del usuario:** 0009_content_control_and_covers.sql y 0010_account_settings.sql, ejecutadas juntas en una transacción en el proyecto Lernze. Se comprobaron columnas, buckets, tres triggers, siete políticas y permisos. Los 18 programas existentes, las clases y los perfiles conservaron sus datos (comparación de huellas antes/después). Foto y nombre se verificaron habilitados en la web publicada. Correo y contraseña usan Supabase Auth sin cambios de esquema.
- Las fotos y portadas son públicas; los videos de clases conservan sus permisos privados. Los archivos usan nombres únicos y las políticas impiden usar imágenes ajenas o borrar imágenes todavía referenciadas.
- Si falla la limpieza de Storage después de guardar/eliminar, se registra el error en el servidor. No hay cola de reintentos de archivos huérfanos. Al cerrar la pestaña sin usar Cancelar, una subida sin guardar puede quedar sin referencia.

### Pruebas

`npm run test:publication` aplica todas las migraciones a PostgreSQL efímero con PGlite y comprueba borradores privados, propiedad, videos, publicación, retirada, progreso y acceso de alumnos. No lee `.env.local` ni se conecta a Supabase. `npm run test:content` comprueba portadas, propiedad, borrado y configuración en PostgreSQL efímero. `npm run test:account` ejecuta las acciones reales de correo y contraseña con el límite de Supabase simulado (sin envíos ni cambios reales). Después: `npm run lint`, `npx tsc --noEmit` y `npm run build`.

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

## Pendientes para revisar a mano

- [ ] Con sesión iniciada: crear un programa subiendo un trailer desde `/crear`, cargarle 2 clases (una marcada como vista previa) y comprobar el temario en la página del programa.
- [ ] Con otra cuenta: ver la clase de vista previa sin unirse, unirse, completar una clase y ver el avance en Mi cuenta.
- [ ] Con sesión iniciada: abrir 2 o 3 programas y confirmar que en Inicio aparecen "Vistos recientemente" y "Porque viste X", y que salen en Mi cuenta.
- [ ] Con sesión iniciada: revisar Mi cuenta en el celular y editar intereses desde ahí (debe volver a Mi cuenta al guardar).
- [ ] En el SQL Editor de Supabase, borrar el correo de prueba del newsletter: `delete from public.newsletter_subscribers where email = 'prueba-newsletter@lernze.test';`

## Siguiente

1. Cobros con Stripe Connect en modo de prueba (necesita cuenta y claves de Stripe).
2. Comunidad del programa (foro), sesiones en vivo y tabla de posiciones.
3. Panel del creador con métricas: alumnos, ingresos por origen, avance promedio.
4. Videos más largos: Supabase gratis limita a 50 MB por archivo; para clases largas, plan Pro o un servicio de video (Mux, Cloudflare Stream).
5. Generación del trailer con IA.
4. Textos legales definitivos y direcciones reales de redes sociales (`SOCIAL` en `src/components/Footer.tsx`).

### Ajustes de acceso y prueba visual (2026-10-30)

- Correo y contraseña se despliegan al pulsar su botón y permiten Cancelar. El login incluye «Olvidé mi contraseña», con enlace de recuperación PKCE y validación de sesión reciente de recuperación en el servidor. Abre el enlace en el mismo navegador.
- 0011_account_password_status.sql aplicada con autorización: consulta únicamente si la cuenta propia tiene contraseña; no modifica credenciales ni contenido. Permite detectar también cuentas de Google con contraseña añadida.
- Para cuentas externas, crear una contraseña requiere un enlace de correo verificado. No se cambiaron credenciales ni se enviaron correos reales durante las pruebas. La entrega real de emails depende de la configuración de Supabase/SMTP y las URL de redirección.
- Las 17 portadas fotográficas se muestran directamente en el catálogo, búsqueda, categorías y programas. /vista-previa-portadas redirige a Inicio.
- Intereses permite consultar los temas iniciales. Las recomendaciones conservan las señales de vistas existentes; combinar creadores, búsquedas y temas acumulados sigue pendiente.

### Portadas y trailers de los 17 programas de prueba

- Cada programa publicado existente tiene una fotografía generada con una persona ficticia mirando a cámara, en `public/images/catalog-covers`. `Stage` conserva los títulos y colores nativos, con encuadre preparado para móvil. No hay una galería aparte.
- `public/videos/catalog-trailers` contiene 17 MP4 H.264, 1280×720, 14 segundos, con movimiento suave de las fotografías. No tienen audio ni animación de labios. `StageLive` reproduce los archivos sin textos promocionales, etiquetas, brillo ni textura superpuestos; al pausar conserva el fotograma y los controles nativos. Los clips actuales son muestras de movimiento, no personas hablando, y no contienen subtítulos. Los subtítulos deben venir incorporados en el video.
- La selección en `src/lib/catalog-media.ts` está limitada a los 17 IDs exactos del catálogo consultado. No depende de `demo` (estos registros históricos no tienen esa marca). Los programas nuevos y las clases conservan su comportamiento.
- Una portada propia o una ilustración elegida expresamente tiene prioridad. Un nuevo trailer subido también tiene prioridad sobre la muestra. Los datos originales de Supabase se mantienen para la edición, sin mutaciones ni nuevas migraciones.
- Para regenerar los clips: `FFMPEG=/ruta/al/ejecutable node scripts/render-catalog-trailers.mjs`. El codificador es externo al proyecto; no se añadió dependencia de FFmpeg a la aplicación. `npm run test:catalog` comprueba los 34 archivos, reproducción progresiva y prioridad del contenido del creador.

- Audio de trailers: botón accesible para activar/silenciar y deslizador de volumen en Inicio, tarjetas ampliadas, detalle y página del programa. Se sincroniza con los controles nativos y comienza silenciado. Los 17 clips actuales no tienen pista de audio.

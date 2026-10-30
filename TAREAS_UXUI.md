# Tareas UX/UI — Lernze

> **Estado (2026-10-29):** las 12 tareas están completas. El detalle de lo construido está en la sección "Estado" del README.

## Prioridades identificadas (orden de ejecución)

### 1. Dashboard de usuario (perfil)
- El botón del avatar actualmente hace logout. Debe abrir un dropdown/menú
- Con cuenta: icono perfil + dropdown (mis programas, configuración, cerrar sesión)
- Sin cuenta: Entrar + Crear cuenta

### 2. Navbar
- Logo | Search | [sin cuenta: Entrar + Crear cuenta] / [con cuenta: icono perfil + dropdown]
- "Descubrir" como link al home es redundante — eliminar
- "Crear programa" sale del nav global → se mueve al dashboard del creador
- "Crear programa" expuesto sin cuenta genera confusión y muro de login

### 3. Hero — limpiar CTA
- El botón de la tarjeta compite con el CTA del hero → eliminarlo de la tarjeta
- Un hero, una acción principal

### 4. Switch horizontal/vertical — eliminar
- No aporta valor. El layout lo decide el sistema: horizontal desktop, vertical mobile
- Decisión del sistema, no del usuario

### 5. Categorías vs "Tus intereses"
- Sin cuenta: cambiar "Tus intereses" a "Categorías" (o sin etiqueta, solo chips)
- Con cuenta: mostrar "Tus intereses" con las categorías reales del usuario

### 6. Onboarding de intereses al registrarse
- Paso obligatorio post-registro: "¿Qué te interesa aprender?"
- Chips de categorías → sin esto el Discover pierde su razón de ser
- Con Google OAuth esto es el primer paso real luego de que el email ya está listo

### 7. Search bar
- Ya existe en el header pero falta pulirla / integrarla bien
- Buscar por título de programa, creador y categoría

### 8. Señal "¿Por qué ves esto?"
- Implementar texto tipo "Porque te interesa Negocios" debajo de cada fila del feed
- Está en los mocks del manual de marca (texto turquesa) pero no implementado

### 9. Página de programa — jerarquía y CTA
- Precio visible sin scroll, botón ámbar dominante como CTA principal
- Trailer que se abra fluidamente
- Portada ilustrada bien integrada

### 10. Empty state del feed
- Estado actual funcional pero frío
- Convertirlo en pantalla de invitación atractiva con marca aplicada

### 11. Footer
- Falta totalmente
- Mínimo: links legales, redes sociales, selector de idioma
- Importante para credibilidad

### 12. Mobile
- Todo está pensado desktop-first
- El feed de trailers en mobile es el caso de uso más importante
- Responsive pendiente de trabajar en profundidad

## Gestión de programas — 2026-10-30

- [x] Crear borradores privados antes de cargar las clases.
- [x] Editar información, precio y trailer conservando el enlace del programa.
- [x] Recorrido Información → Clases → Publicación con requisitos y vista previa.
- [x] Validar publicación y proteger contenido publicado desde la base.
- [x] Retirar y volver a publicar conservando acceso de alumnos.
- [x] Pruebas locales de migraciones y permisos sin modificar producción.
- [x] Migración 0008 aplicada en Supabase el 2026-10-30 con autorización del usuario: publicación y retirada activadas.


## Entrega 2026-10-30: control del contenido y configuración

- [x] Portada del trailer y de cada clase, con título + ilustración/fotograma/imagen y encuadre.
- [x] Cancelar creación y edición; quitar/reemplazar videos; confirmar eliminación de clase/programa.
- [x] Configuración separada del dashboard, accesible desde el desplegable.
- [x] Foto propia o inicial, nombre público sincronizado en los programas, temas del feed, correo y contraseña.
- [x] Pruebas locales de permisos, acciones de cuenta y navegador (escritorio y 375 px), sin modificar producción.
- [x] Migraciones 0009 y 0010 aplicadas en Supabase el 2026-10-30 con autorización expresa: activación verificada y datos existentes conservados.
- [ ] Verificar entregas de correos de confirmación en el dominio publicado con una cuenta de prueba autorizada; no se enviaron mensajes reales.

No se agregaron notificaciones, pagos ni eliminación de cuenta en Configuración. No hay reintento automático si falla la limpieza de archivos de Storage.


## Ajustes de configuración: intereses y correo

- [x] Usar «Intereses» y «Ver tus intereses» en Configuración.
- [x] Mostrar el campo de nuevo correo solo al pulsar «Cambiar correo», con foco inicial y Cancelar.
- [ ] Evolucionar las recomendaciones para combinar intereses explícitos con señales de vistas, creadores y búsquedas. Actualmente existen intereses elegidos e inferencias desde vistas como alternativa; no hay un modelo combinado de todas esas señales.

- [x] Formularios de correo y contraseña detrás de botones, con Cancelar.
- [x] Recuperación de contraseña desde el login y creación con enlace verificado para cuentas externas.
- [x] Migración 0011 aplicada con autorización; verificados permisos de consulta propia.
- [x] 17 portadas frontales integradas en el catálogo actual; el enlace de la antigua galería vuelve a Inicio.

## Catálogo de prueba: portadas y clips

- [x] Imagen propia para cada uno de los 17 programas publicados, con el instructor mirando a cámara.
- [x] Inicio, categorías, búsqueda, tarjetas y páginas de programa comparten las portadas nativas.
- [x] 17 clips MP4 de 14 segundos con movimiento suave. Reproducción limpia, sin frases ni efectos superpuestos. Sin voz ni animación facial.
- [x] Las portadas y trailers nuevos del creador tienen prioridad; no se modificaron registros de Supabase.

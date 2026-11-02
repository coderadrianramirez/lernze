# Prioridades actuales — 2026-10-31

1. **Completar la experiencia de ver y subir clases — en verificación.** Retomar, recuperar errores y subidas TUS implementados. Pendientes: autorizar 0012, habilitar acceso a archivos en la extensión y completar la prueba con otra cuenta.
2. Perfiles públicos de creadores y seguimiento.
3. **Intereses y recomendaciones adaptativas — activos y verificados.** 0014 aplicada con autorización; señales reales comprobadas. El seguimiento depende de 0013.
4. **Feed vertical «Descubrir» en móvil y escritorio — siguiente paso.** Definir y revisar la experiencia en ambos formatos antes de implementar.
5. Comunidad básica y notificaciones.
6. Confianza y gestión: reseñas, moderación y métricas.
7. Preparación del lanzamiento: correos, soporte y documentos legales.
8. Stripe, al final.

Banco de ideas separado, todavía sin compromiso de implementación: módulos, recursos descargables, ficha ampliada, guardar programas, notas por minuto, proyectos, cuestionarios, certificados, liberación programada, calendario, gamificación y tutor con IA.

---

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

- [x] Control de audio de trailers: activar/silenciar, ajustar volumen y sincronizar con el reproductor nativo, también en móvil.

### Perfiles de creadores y seguimiento — 2026-10-31

- Perfiles públicos en /creador/[id], con nombre y foto de Configuración, temas y programas publicados. Los borradores no aparecen; el propietario puede revisar su perfil antes de publicar. No se añadieron biografía ni redes.
- Accesos desde programas, tarjetas ampliadas, buscador y Mi cuenta. /siguiendo reúne los creadores seguidos, con paginación y estado vacío. Seguir/dejar de seguir requiere sesión; no se permite seguirse a uno mismo.
- Migración 0013 preparada y validada localmente, pendiente de autorización para producción. La lista de seguimiento es privada; el directorio solo devuelve nombre, foto y contadores públicos. No cambia registros del catálogo existente.
- Los 17 programas históricos tienen creator_id vacío y no están marcados demo. Se muestran perfiles de ejemplo identificados, sin cuentas ni seguidores inventados. Las cuentas reales se vinculan por UUID; su perfil se registra al publicar su primer programa y permanece si retiran sus programas.
- Pruebas: npm run test:creators (migración con programas sin propietario, RLS, búsqueda con tildes, conteos, acciones y errores). Recorrido de búsqueda → perfil → programa revisado en Chrome a 375 px y escritorio. El seguimiento real en producción queda pendiente de activar 0013 y publicar un programa real.

### Intereses y recomendaciones adaptativas — 2026-11-01

- El inicio combina temas iniciales, aperturas de programas, trailers vistos, coincidencias de búsqueda, visitas sostenidas a perfiles, inscripciones y creadores seguidos. No sobrescribe los intereses del registro.
- Motor determinista y comprobable en src/lib/recommendations.ts. La actividad pierde la mitad de su peso cada 21 días y deja de influir a los 90. Una señal por programa/tipo; se toma la más fuerte de cada programa. La categoría se satura para que repetir acciones no domine el inicio.
- Afinidad entre títulos y descripciones (palabras normalizadas, peso mayor del título y menor de términos comunes), además de categoría y creador. Sin IA externa ni coste por recomendación. Pequeña ventaja para programas recientes, popularidad acotada y hasta dos espacios de exploración en los ocho primeros resultados cuando hay otros temas disponibles. Se limita la repetición de creador/categoría mientras existan alternativas. El motor devuelve hasta 60 resultados.
- Programas propios, ya adquiridos, no publicados y ocultados no entran en recomendaciones. Búsqueda y filtros manuales siguen mostrando el catálogo público; Vistos recientemente conserva el historial. La categoría elegida por URL no modifica intereses persistidos.
- /intereses explica temas iniciales, intereses inferidos y sus fuentes. Configuración y el inicio enlazan con «Ver tus intereses». El detalle del feed muestra el motivo individual. «No me interesa este programa» oculta la recomendación hasta 180 días y puede revertirse desde Intereses.
- Los trailers cuentan tras ocho segundos de reproducción real, visible y sin salto de tiempo. No se cuenta el hero automático. Una búsqueda debe permanecer estable 1,5 segundos: solo se conservan coincidencias públicas, una por categoría y como máximo tres, nunca su texto. Una visita al perfil necesita seis segundos visibles. No se registra actividad durante render/precarga. Al volver a Inicio se actualizan los datos sin reordenar un vídeo durante su reproducción.
- Migración 0014 aplicada en Supabase el 2026-11-01 con autorización expresa, independiente de 0012/0013. Señales privadas con RLS y escritura por RPC que valida sesión, programa público, propiedad y fecha del servidor. Repeticiones en seis horas no renuevan fecha; máximo 400 señales por cuenta y limpieza de registros de más de 180 días al registrar actividad. Sin activación se usan temas iniciales, visitas e inscripciones; seguir requiere también 0013. El botón de ocultar solo se ofrece con el esquema activado.
- Pruebas: npm run test:recommendations verifica ranking, temas dentro de una categoría, recencia, deduplicación, exploración, catálogo grande, exclusiones, aislamiento entre cuentas, restauración y acciones sin texto de búsqueda. Comprobaciones de publicación, contenido, cuenta, recuperación, reproducción, creadores y medios conservadas. Las comprobaciones de escritorio y móvil se registran en la entrega; la activación y pruebas reales de trailer, búsqueda, perfil y ocultar/restaurar se completaron con autorización.
- Primera versión basada en reglas: los pesos son hipótesis de producto, no un modelo validado con usuarios reales. Los datos de ejemplo no permiten medir la relevancia real ni la calidad de aprendizaje. Con actividad real habrá que evaluar diversidad, programas descubiertos y avance, sin optimizar solo clics o tiempo de pantalla.

- Corrección de navegación detectada en la prueba real: el detalle emergente cierra su diálogo al navegar y al ocultarse con Activity, para que no bloquee los clics de otras páginas. La vista de trailer dentro de ese detalle también aporta la señal cualificada.

- Inicio y recomendaciones al pie del programa comparten el motor y las exclusiones; el detalle utiliza además el programa abierto como contexto. Los sugeridos del modal del inicio respetan el conjunto permitido.

## Siguiente paso propuesto: feed vertical «Descubrir» — 2026-11-01

Solicitud del usuario: añadir un feed vertical de contenido como diferencial móvil y definir primero cómo funciona también en escritorio. Esta sección registra la propuesta; todavía no hay implementación ni aprobación del diseño detallado.

- Mantener Inicio como catálogo y sumar una sección compartida /descubrir. En móvil, proponer acceso desde la barra inferior manteniendo cuatro destinos: Inicio, Descubrir, Buscar y Cuenta. Ofertas conserva acceso desde Inicio. Revisar esta navegación con el usuario antes de cambiarla.
- Móvil: un contenido por pantalla, deslizamiento vertical y ajuste al terminar el gesto. Respetar áreas seguras y controles táctiles. Separar la interfaz del creador y «Ver programa» de la imagen del vídeo; los subtítulos deben venir del contenido, según la preferencia actual del usuario. Mantener audio y pausa accesibles.
- Escritorio: reproductor vertical centrado, ajustado a la altura disponible; panel lateral con creador, título, información del programa y CTA. Avance por rueda/trackpad, botones y teclado, evitando capturar teclas mientras se usan controles o campos. Conservar el catálogo para explorar y comparar programas.
- Un solo vídeo activo; pausar el anterior al avanzar o dejar la pestaña, iniciar sin audio hasta que la persona lo active y cargar los siguientes con moderación. Conservar posición al visitar un perfil o programa y volver.
- Primera validación con los trailers públicos existentes, el reproductor y el algoritmo actuales. Las muestras existentes son 16:9 y clips animados de fotografías: conservar su encuadre, sin estirar ni recortar rostros para simular 9:16. La versión final necesita material vertical real; prever una muestra de subida y encuadre vertical antes de extender la gestión de medios.
- Diferencial a desarrollar después de validar el recorrido: microcontenidos educativos públicos del creador, vinculados a sus programas. Distinguir cada clip del programa que promociona; no convertir clases privadas en contenido público. El alta, edición, eliminación y cualquier migración necesaria deberán diseñarse y revisarse en ese bloque.
- Reutilizar recomendaciones e intereses: reproducción visible e intencional, relevancia de tema/creador, diversidad y «No me interesa». El autoplay del feed requiere tratamiento explícito distinto del hero automático. Evaluar después señales de finalización, repetición y salto rápido; un salto aislado no debe borrar un interés. No optimizar únicamente por tiempo de pantalla.
- Acciones iniciales propuestas: pausar/audio, abrir perfil, seguir cuando 0013 esté activa, compartir por decisión del usuario y abrir el programa. No presentar comentarios ni cifras de interacción ficticias como funciones reales.
- Dependencias del feed: 0014 para señales persistidas nuevas (ya activada con autorización), 0013 para seguimiento (pendiente). No ejecutar cambios de base sin autorización.
- Orden: revisar diseño móvil + escritorio y navegación → validar formato del material → implementar recorrido con trailers públicos → probar con sesión y sin ella, regreso al feed, audio, teclado, 375 px y escritorio → diseñar microcontenidos si se confirma esa ampliación.

### Activación de recomendaciones — 2026-11-01

- 0014 ejecutada desde Chrome en Supabase de Lernze con autorización expresa. Tabla y ambas funciones verificadas. 0012 y 0013 no se aplicaron.
- Se ajustó la revocación explícita de EXECUTE a los roles anon y authenticated antes de concederlo solo a authenticated: Supabase concede permisos explícitos por defecto a funciones nuevas. La función ya rechazaba operaciones sin auth.uid(); ahora tampoco admite la invocación anónima. El archivo 0014 incorpora esa corrección para instalaciones nuevas y su prueba reproduce los privilegios por defecto de Supabase. No se requiere volver a ejecutar 0014 en este proyecto.
- Auditoría real: 12 comprobaciones de tabla privada, RLS, lectura propia, prohibición de escritura directa y ejecución anónima, funciones protegidas y migraciones pendientes. Todas aprobadas.
- Chrome con sesión: trailer de Uñas de salón, búsqueda Google Ads, visita sostenida al perfil de ejemplo de Marisol Vega y ocultar/restaurar programa. Se verificó su persistencia y que el programa quedara restaurado. No se enviaron mensajes, no se hicieron compras ni se publicó contenido.
- Las huellas de programas y perfiles coinciden antes y después; siguen existiendo 18 programas y 0 clases. Las señales son actividad de prueba del catálogo existente, no métricas de usuarios reales para calibrar el modelo.

### Estabilidad y audio del hero — 2026-11-01

- Clips del catálogo de prueba regenerados a 30 fps con sobremuestreo antes del zoom para reducir los saltos de encuadre por redondeo. Primer/último fotograma alineados con la portada y bucle suave; siguen sin voz ni audio.
- El video saliente continúa durante el fundido del hero; ya no vuelve al fotograma inicial antes de desaparecer.
- Audio del hero alineado con el margen derecho del contenido, por encima de los indicadores; en móvil, esquina superior derecha. Volumen desplegable hacia dentro, con área táctil de 44 px.
- Revisión en Chrome de escritorio y 375 px: reproducción, rotación, activar/silenciar y deslizador, sin desbordamiento horizontal. No requiere migraciones ni cambios de datos.

### Feed vertical «Descubrir» — 2026-11-02

- /descubrir implementado con trailers públicos y el motor compartido de recomendaciones, sin una migración nueva. Inicio conserva su catálogo.
- Navegación móvil solicitada: Inicio | Ofertas | Descubrir | Buscar | Cuenta, con Descubrir en el centro. Acceso también en el header de escritorio y footer.
- Un contenido por pantalla, desplazamiento con ajuste vertical, botones anterior/siguiente y teclado. Escritorio con reproductor y panel lateral; móvil con información y CTA fuera de la imagen. Los videos horizontales se muestran completos, sin recortar ni estirar rostros; el reproductor admite también material vertical.
- Solo el video activo se reproduce; como máximo tres reproductores montados. Audio silenciado al comenzar, volumen compartido entre trailers, pausa al salir de la página/pestaña y respeto de movimiento reducido. Sin textos promocionales superpuestos al video.
- Al visitar un perfil/programa y volver se conserva el contenido y la posición. La copia de sesión dura dos horas, está separada por cuenta y descarta IDs retirados/ocultos/no elegibles. No se recupera contenido privado desde esa copia.
- Recomendaciones: ocho segundos reales y visibles tras una interacción en el feed; la reproducción automática inicial no suma interés. Saltos de tiempo y reinicios de bucle no se contabilizan. Ocultar/restaurar comparte las acciones y permisos existentes de 0014. Seguir solo se ofrece para cuentas reales cuando 0013 esté disponible; los ejemplos no admiten seguimiento.
- Compartir por acción del usuario mediante el sistema o copia del enlace. Sin me gusta, comentarios ni contadores de actividad inventados. Los clips actuales siguen siendo fotografías animadas sin voz.
- Pruebas: npm run test:discovery, test:recommendations, lint, TypeScript y build; recorrido de visitante en navegador a 375 px y escritorio, avance/pausa/volumen, perfil/programa y regreso. La activación de 0012/0013 y la prueba de seguimiento entre cuentas reales siguen siendo tareas separadas; no se aplicaron migraciones en este bloque.

- Corrección de navegación móvil: los marcadores NoTabBar/ShowFooterOnMobile de páginas ocultas por Activity ya no afectan la página visible. Comprobado programa → regresar a Descubrir.

### Conversaciones por clase — 2026-11-02

- Aula: comentarios con texto de hasta 2000 caracteres, hasta cuatro fotos por mensaje y respuestas agrupadas en un nivel. Identidad del creador visible. Fotos ampliables, edición y eliminación propias y moderación por el creador. Cargar/publicar respuestas no refresca el aula ni reinicia su video.
- Solo alumnos inscritos y creador pueden leer/publicar; una clase pública de vista previa no expone la conversación ni las fotos. Retirar un programa conserva acceso para inscritos; perder la inscripción lo revoca. La lista solo devuelve nombre y foto del autor, sin correos ni otros datos del perfil.
- Borrar elimina texto y referencias a fotos; si existen respuestas, se conserva el hilo sin mostrar la identidad del comentario eliminado. Se confirma antes de eliminar. Las respuestas no se borran al moderar al padre. No se permite editar mensajes ajenos, mover respuestas entre clases ni crear niveles de respuestas adicionales.
- Migración 0015_lesson_comments.sql aplicada el 2026-11-02 en Supabase desde Chrome, con autorización expresa, independiente de 0012/0013. RLS, escritura solo por RPC, validación de pertenencia, límites de diez publicaciones por minuto, paginación por fecha e ID y bucket privado comment-images.
- Fotos: JPEG/PNG/WebP de hasta 8 MiB en el navegador, convertidas a WebP hasta 1600 px y 5 MiB sin metadatos del original; subidas firmadas dentro de usuario/clase. Enlaces de lectura firmados por diez minutos, con renovación bajo la sesión actual. El creador no puede ver adjuntos aún sin enviar; la cola privada de referencias retiradas permite limpiar las fotos que modera.
- La limpieza de Storage después de editar/borrar se intenta en el servidor. Si falla, queda registrada; no se implementó un trabajador de reintentos. La eliminación en cascada de una clase/programa retira el acceso a sus comentarios y deja referencias de limpieza, pero la eliminación física de esas fotos queda pendiente de un proceso de mantenimiento. Un cierre abrupto durante una subida también puede dejar un archivo sin publicar. La activación autorizada y su auditoría se registran más abajo.
- Pruebas: npm run test:comments (PostgreSQL efímero y acciones con sesión simulada), más comprobaciones de publicación/contenido y lint, TypeScript y build. Interfaz verificada con datos ficticios locales: crear/responder/editar/eliminar, ampliación de foto, selección y compresión real de archivo, conservación del borrador ante error, escritorio y 375 px. La subida y conversación completas en Supabase con dos cuentas quedan pendientes de disponer de una clase real y dos cuentas; 0015 ya está activada.
- /pruebas/comentarios existe solo con next dev; producción devuelve 404. Es un banco de pruebas con transporte local, no una página pública de ejemplos ni datos reales. Los ejemplos nunca se insertan en la base.

### Activación de comentarios — 2026-11-02

- 0015 ejecutada desde Chrome en el proyecto Lernze main/PRODUCTION con autorización expresa. Se verificaron catorce condiciones: RLS en ambas tablas, permisos privados de lectura, escritura exclusiva por RPC, seis funciones limitadas a autenticados con search_path vacío, trigger no invocable, bucket privado de WebP de 5 MiB y tres políticas de fotos. Todas aprobadas.
- Las huellas de los programas, clases y perfiles coinciden antes y después: siguen existiendo 18 programas y 0 clases. No se crearon comentarios ni imágenes de prueba en producción. Las migraciones 0012 y 0013 no se ejecutaron.
- Código publicado y ruta local de pruebas comprobada como 404 en producción. La interfaz y los permisos se probaron de forma aislada; la conversación y subida real entre dos cuentas requieren cargar una clase y completar ese recorrido, sin presentar datos ficticios como actividad real.

### Mi perfil y navegación de cuenta — 2026-11-02

- Menú: Mi perfil, Mi cuenta, Configuración y Crear programa, además de cerrar sesión. Mi cuenta mantiene inscripciones y gestión de programas.
- /perfil conduce al perfil propio: foto y nombre con edición rápida, programas publicados y pestaña Siguiendo privada. /siguiendo redirige a esa pestaña. Configuración conserva correo, contraseña e intereses y enlaza al editor del perfil.
- La sesión decide quién puede consultar Siguiendo; otra cuenta o un visitante no recibe la lista, su contador ni los controles de edición aunque manipule la URL. Los borradores no aparecen entre los programas públicos.
- 0013 aplicada desde Chrome en Lernze main/PRODUCTION con la autorización expresa anterior. Trece comprobaciones de permisos, RLS y conservación de datos aprobadas: siguen 18 programas y 0 clases; las huellas de programas y perfiles no cambiaron. 0012 continúa pendiente; 0015 permanece activa.
- Pruebas aisladas de privacidad del perfil, permisos de seguimiento y acciones de cuenta aprobadas. El seguimiento real entre dos cuentas requiere un creador real con programa publicado; el catálogo de ejemplo no permite seguir identidades ficticias.

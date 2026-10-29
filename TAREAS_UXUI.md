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

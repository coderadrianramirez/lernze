-- Datos de prueba realistas para Lernze — mínimo 3 cursos con video por categoría.
-- Videos: Google CDN sample MP4s (~15 s, dominio público).
-- Ejecutar en Supabase SQL Editor del proyecto qklesbhkkfmtluntwjqt.

insert into public.courses
  (slug, title, description, creator_name, category, price_cents, currency,
   trailer_source, trailer_url, trailer_seconds,
   art, scenes, members_count, rating, demo, published)
values

-- ═══════════════════════════════════════════════════
--  NEGOCIOS  (4 cursos, todos con video)
-- ═══════════════════════════════════════════════════
('abre-tu-negocio-online',
 'Abre tu negocio online',
 'Del primer producto a las primeras ventas: elige qué vender, monta tu tienda y consigue tus primeros clientes en menos de 30 días.',
 'Marisol Vega', 'Negocios', 14900, 'USD', 'creator',
 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', 15,
 '{"lines":["Abre tu","negocio","online"],"hl":1,"prop":"doc","bust":"long","outfit":"#2b3f66","glow":"#ffb547","a":"#12304a","b":"#5a2340","glyph":"$"}'::jsonb,
 array['¿Y si tu primera venta fuera esta semana?','Elige qué vender. Monta tu tienda.','Seis módulos. Tres plantillas. Cero rodeos.','"Abrí mi tienda un martes y vendí el jueves." — Ana, alumna','Abre tu negocio online desde cero.'],
 2140, 4.9, false, true),

('dropshipping-latinoamerica',
 'Dropshipping para Latinoamérica',
 'Proveedores confiables, métodos de pago y logística sin almacén propio. Especial para México, Colombia y Argentina.',
 'Roberto Salinas', 'Negocios', 11900, 'USD', 'creator',
 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', 15,
 '{"lines":["Dropshipping","para LATAM"],"hl":0,"prop":"doc","bust":"short","outfit":"#1a3a5a","glow":"#ffaa33","a":"#0f2a44","b":"#3a1a2a","glyph":"▲"}'::jsonb,
 array['Sin bodega, sin stock, sin excusas.','Proveedores que sí envían a LATAM.','Pagos locales y logística resuelta.','"Vendí $4.000 el primer mes." — Roberto, alumno','Dropshipping para Latinoamérica desde cero.'],
 1830, 4.7, false, true),

('freelance-desde-cero',
 'Freelance desde cero',
 'Consigue tus primeros tres clientes en 30 días vendiendo lo que ya sabes hacer. Sin experiencia previa necesaria.',
 'Carolina Fuentes', 'Negocios', 8900, 'USD', 'creator',
 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4', 15,
 '{"lines":["Freelance","desde","cero"],"hl":2,"prop":"case","bust":"long","outfit":"#2a4a3a","glow":"#a0ffcc","a":"#1a3a2a","b":"#3a2a1a","glyph":"✓"}'::jsonb,
 array['Tienes más para ofrecer de lo que crees.','Tres clientes en 30 días, paso a paso.','Propuestas, precios y cobros.','"Renuncié a mi trabajo en 4 meses." — Carolina, alumna','Freelance desde cero con clientes reales.'],
 3140, 4.8, false, true),

('vende-en-amazon-fba',
 'Vende en Amazon FBA',
 'Encuentra productos rentables, importa desde China y lanza tu marca en Amazon con logística incluida.',
 'Héctor Vidal', 'Negocios', 19700, 'USD', 'creator',
 'https://storage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4', 15,
 '{"lines":["Amazon","FBA"],"hl":0,"prop":"doc","bust":"short","outfit":"#1a1a4a","glow":"#ff9900","a":"#0f0f3a","b":"#3a1a0f","glyph":"A"}'::jsonb,
 array['Amazon FBA: el negocio que trabaja sin ti.','Productos rentables y proveedores en China.','Tu marca, tu listing, tu FBA.','"Mi primer producto generó $8.000 en 60 días." — Héctor, alumno','Vende en Amazon FBA desde Latinoamérica.'],
 2760, 4.7, false, true),

-- ═══════════════════════════════════════════════════
--  MARKETING  (4 cursos, todos con video)
-- ═══════════════════════════════════════════════════
('tiktok-shop-con-ia',
 'TikTok Shop con IA',
 'Productos ganadores, videos con IA y embudos para vender sin inventario.',
 'Camila Duarte', 'Marketing', 9700, 'USD', 'creator',
 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4', 15,
 '{"lines":["TikTok","shop","con IA"],"hl":2,"prop":"phone","bust":"bun","outfit":"#3a2a63","glow":"#ff6ea8","a":"#3b1450","b":"#0f3a50","glyph":"TT"}'::jsonb,
 array['Vender sin inventario sí se puede.','Productos ganadores. Videos con IA.','Un embudo que trabaja mientras duermes.','"Mi primer producto vendió en 48 horas." — Camila, alumna','Ventas en TikTok Shop con IA.'],
 3810, 4.7, false, true),

('contenido-con-ia-para-tu-negocio',
 'Contenido con IA para tu negocio',
 'Un mes de contenido en una tarde: guiones, video y calendario con herramientas de IA.',
 'Rafa Núñez', 'Marketing', 6900, 'USD', 'creator',
 'https://storage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4', 60,
 '{"lines":["Contenido","con IA"],"hl":1,"prop":"chip","bust":"short","outfit":"#1f4a52","glow":"#8bf0ff","a":"#1b4a46","b":"#3a1b4a","glyph":"IA"}'::jsonb,
 array['Un mes de contenido en una tarde.','Guiones, video y calendario.','Herramientas de IA que sí sirven.','"Dejé de improvisar cada día." — Rafa, alumno','Contenido con IA para tu negocio.'],
 4210, 4.6, false, true),

('instagram-para-creadores',
 'Instagram para creadores',
 'Reels que viralizan, carruseles que convierten y DMs que venden. Estrategia completa de monetización.',
 'Valentina Ríos', 'Marketing', 8900, 'USD', 'creator',
 'https://storage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4', 30,
 '{"lines":["Instagram","para","creadores"],"hl":2,"prop":"phone","bust":"curly","outfit":"#4a1a5a","glow":"#ffaaff","a":"#3a0a4a","b":"#1a0a3a","glyph":"IG"}'::jsonb,
 array['Tu cuenta estancada tiene solución.','Reels que viralizan. Carruseles que convierten.','Monetización con DMs y links.','"Pasé de 800 a 28.000 seguidores." — Valentina, alumna','Instagram para creadores con resultados.'],
 5620, 4.8, false, true),

('google-ads-para-pymes',
 'Google Ads para pymes',
 'Campañas de búsqueda, shopping y remarketing con presupuesto de $5/día. Resultados medibles desde la primera semana.',
 'Luis Méndez', 'Marketing', 13900, 'USD', 'creator',
 'https://storage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4', 15,
 '{"lines":["Google Ads","para","pymes"],"hl":0,"prop":"chip","bust":"short","outfit":"#1a3a5a","glow":"#4285f4","a":"#0f2a44","b":"#1a0a2a","glyph":"G"}'::jsonb,
 array['Anuncios que se pagan solos.','Búsqueda, shopping y remarketing.','$5 al día con resultados medibles.','"Tripliqué mis consultas en dos semanas." — Luis, alumno','Google Ads para pymes sin agencia.'],
 2390, 4.7, false, true),

-- ═══════════════════════════════════════════════════
--  IDIOMAS  (3 cursos, todos con video)
-- ═══════════════════════════════════════════════════
('ingles-para-cerrar-ventas',
 'Inglés para cerrar ventas',
 'Frases, guiones y roleplays para vender en inglés sin perder tu acento ni tu confianza.',
 'Coach Andrés R.', 'Idiomas', 7900, 'USD', 'creator',
 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4', 60,
 '{"lines":["Inglés para","cerrar","ventas"],"hl":2,"prop":"bubble","bust":"short","outfit":"#1f4d52","glow":"#7fd6c8","a":"#0f3d3e","b":"#1b2a5a","glyph":"En"}'::jsonb,
 array['Tu inglés te está costando ventas.','Frases reales para cerrar el trato.','Roleplays con feedback.','"Cerré mi primer cliente en inglés." — Carlos, alumno','Inglés para cerrar ventas.'],
 5320, 4.8, false, true),

('ingles-para-la-entrevista-de-trabajo',
 'Inglés para la entrevista de trabajo',
 'Preguntas reales, respuestas modelo y práctica con feedback de coach nativo.',
 'Prof. Valeria Cruz', 'Idiomas', 4900, 'USD', 'creator',
 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 60,
 '{"lines":["Inglés para","la entrevista"],"hl":1,"prop":"case","bust":"long","outfit":"#3f3a5a","glow":"#ffcf7a","a":"#2a3a4a","b":"#4a3a2a","glyph":"Hi"}'::jsonb,
 array['La entrevista decide tu empleo.','Preguntas reales y respuestas modelo.','Práctica con feedback.','"Me contrataron a la primera." — Valeria, alumna','Inglés para la entrevista de trabajo.'],
 7340, 4.8, false, true),

('portugues-de-negocios',
 'Portugués de negocios',
 'Reuniones, emails y negociaciones con empresas de Brasil. El idioma del mercado más grande de LATAM.',
 'Priscila Andrade', 'Idiomas', 6900, 'USD', 'creator',
 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', 60,
 '{"lines":["Portugués","de","negocios"],"hl":1,"prop":"bubble","bust":"long","outfit":"#1a3a5a","glow":"#33cc55","a":"#0f2a3a","b":"#3a2a0f","glyph":"Pt"}'::jsonb,
 array['Brasil es el mercado más grande de LATAM.','Reuniones, emails y negociaciones.','Acento brasileiro que abre puertas.','"Cerré mi primer contrato en Brasil." — Priscila, alumna','Portugués de negocios desde cero.'],
 1820, 4.7, false, true),

-- ═══════════════════════════════════════════════════
--  OFICIOS  (3 cursos, todos con video)
-- ═══════════════════════════════════════════════════
('barberia-pro',
 'Barbería pro',
 'Degradados, barba y atención al cliente. Incluye cómo cobrar y llenar tu agenda en menos de 60 días.',
 'Luis ''El Fino''', 'Oficios', 19900, 'USD', 'creator',
 'https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4', 60,
 '{"lines":["Barbería","pro"],"hl":1,"prop":"scissors","bust":"beard","outfit":"#4a2424","glow":"#ff8a5c","a":"#3a1c1c","b":"#1c1c3a","glyph":"BP"}'::jsonb,
 array['Un buen degradado no se improvisa.','Técnica, barba y atención al cliente.','Y cómo llenar tu agenda.','"Pasé de 5 a 25 clientes por semana." — Luis, alumno','Barbería profesional desde cero.'],
 980, 4.9, false, true),

('unas-de-salon-desde-cero',
 'Uñas de salón desde cero',
 'Técnica, precios, redes y primeros clientes. Todo desde tu casa o cabina, sin inversión en local.',
 'Yaneisy Lora', 'Oficios', 12900, 'USD', 'creator',
 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', 15,
 '{"lines":["Uñas","de salón"],"hl":0,"prop":"bottle","bust":"curly","outfit":"#5a2a55","glow":"#ff9ad5","a":"#4a1b3c","b":"#2b1b5a","glyph":"✿"}'::jsonb,
 array['De tu casa a $3.000 al mes.','Técnica, precios y primeros clientes.','Redes que traen reservas.','"Mi agenda se llenó en un mes." — Yaneisy, alumna','Uñas de salón desde cero.'],
 2470, 4.9, false, true),

('maquillaje-profesional-desde-cero',
 'Maquillaje profesional desde cero',
 'Corrección, contouring, ojos y labios. Técnicas para maquillar a otras personas y cobrar $60–$120 por sesión.',
 'Daniela Montoya', 'Oficios', 15900, 'USD', 'creator',
 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', 15,
 '{"lines":["Maquillaje","profesional"],"hl":0,"prop":"bottle","bust":"long","outfit":"#6a1a4a","glow":"#ffaacc","a":"#5a0a3a","b":"#3a0a5a","glyph":"💄"}'::jsonb,
 array['El maquillaje que cobras es el que dominas.','Corrección, contouring y ojos ahumados.','Técnica y clientela desde el día uno.','"Empecé a cobrar $80 por sesión." — Daniela, alumna','Maquillaje profesional desde cero.'],
 1840, 4.8, false, true),

-- ═══════════════════════════════════════════════════
--  INVERSIÓN  (3 cursos, todos con video)
-- ═══════════════════════════════════════════════════
('tu-primera-propiedad-de-inversion',
 'Tu primera propiedad de inversión',
 'Financiamiento, análisis de zonas y cómo evitar los errores caros que cometen el 80% de los compradores.',
 'Jorge Alcántara', 'Inversión', 24900, 'USD', 'creator',
 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4', 15,
 '{"lines":["Tu primera","propiedad"],"hl":1,"prop":"house","bust":"short","outfit":"#1f4a3a","glow":"#6fd38b","a":"#173a2d","b":"#0d2a45","glyph":"RE"}'::jsonb,
 array['Tu primera propiedad no es un sueño lejano.','Financiamiento y análisis de zonas.','Los errores caros, explicados.','"Compré mi primer departamento a los 29." — Jorge, alumno','Tu primera propiedad de inversión.'],
 1560, 4.8, false, true),

('finanzas-personales-paso-a-paso',
 'Finanzas personales paso a paso',
 'Crédito, ahorro y primera inversión sin tecnicismos. Diseñado para quienes nunca han ahorrado en serio.',
 'Dr. Esteban Mora', 'Inversión', 5900, 'USD', 'creator',
 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4', 15,
 '{"lines":["Finanzas","personales"],"hl":0,"prop":"percent","bust":"short","outfit":"#22405a","glow":"#9bd96a","a":"#1b2f4a","b":"#2f4a1b","glyph":"%"}'::jsonb,
 array['Tu dinero merece un plan.','Crédito, ahorro y primera inversión.','Sin tecnicismos.','"Por fin entiendo mis finanzas." — Rosa, alumna','Finanzas personales paso a paso.'],
 6120, 4.8, false, true),

('crypto-para-principiantes',
 'Cripto para principiantes',
 'Bitcoin, Ethereum y altcoins: qué comprar, cuándo entrar, cómo guardar tus activos y no perder tu dinero.',
 'Nico Aranda', 'Inversión', 8900, 'USD', 'creator',
 'https://storage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4', 15,
 '{"lines":["Cripto","para","principiantes"],"hl":1,"prop":"chip","bust":"short","outfit":"#1a2a4a","glow":"#f7931a","a":"#0f1f3a","b":"#2a1a0f","glyph":"₿"}'::jsonb,
 array['No necesitas ser experto para invertir en crypto.','Bitcoin, Ethereum y las que realmente importan.','Cuándo entrar y cuándo salir.','"Recuperé mi inversión en 3 meses." — Nico, alumno','Cripto para principiantes con cabeza.'],
 3240, 4.6, false, true)

on conflict (slug) do update set
  title        = excluded.title,
  description  = excluded.description,
  creator_name = excluded.creator_name,
  category     = excluded.category,
  price_cents  = excluded.price_cents,
  trailer_source = excluded.trailer_source,
  trailer_url  = excluded.trailer_url,
  trailer_seconds = excluded.trailer_seconds,
  art          = excluded.art,
  scenes       = excluded.scenes,
  members_count = excluded.members_count,
  rating       = excluded.rating,
  demo         = excluded.demo,
  published    = excluded.published;

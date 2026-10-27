// Genera supabase/seed/demo_programs.sql con los programas de ejemplo de src/lib/demo-programs.ts.
// Uso: node scripts/make-seed-sql.mjs <urlPublicaDelBucket>
//   ej. https://xxxx.supabase.co/storage/v1/object/public/trailers/demo-carpeta
// El video de cada programa se espera en <urlPublicaDelBucket>/<slug>.mp4
import { mkdir, writeFile } from "node:fs/promises";
import { DEMO_PROGRAMS } from "../src/lib/demo-programs.ts";

const base = process.argv[2];
if (!base) throw new Error("uso: make-seed-sql.mjs <urlPublicaDelBucket>");

const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
const arr = (xs) => `array[${xs.map(q).join(", ")}]::text[]`;

const rows = DEMO_PROGRAMS.map((p) => {
  const url = `${base.replace(/\/$/, "")}/${p.slug}.mp4`;
  return `(${[
    q(p.slug),
    q(p.title),
    q(p.description),
    q(p.creatorName),
    q(p.category),
    p.priceCents,
    q("USD"),
    q(p.trailerSource),
    q(url),
    p.trailerSeconds,
    `${q(JSON.stringify(p.art))}::jsonb`,
    arr(p.scenes),
    p.members,
    p.rating,
    "true",
    "true",
  ].join(", ")})`;
});

const sql = `-- Programas de ejemplo (demo = true). Generado por scripts/make-seed-sql.mjs: no editar a mano.
-- Para quitarlos: delete from public.courses where demo;
insert into public.courses
  (slug, title, description, creator_name, category, price_cents, currency, trailer_source, trailer_url, trailer_seconds, art, scenes, members_count, rating, demo, published)
values
${rows.join(",\n")}
on conflict (slug) do update set
  title = excluded.title, description = excluded.description, creator_name = excluded.creator_name,
  category = excluded.category, price_cents = excluded.price_cents, trailer_source = excluded.trailer_source,
  trailer_url = excluded.trailer_url, trailer_seconds = excluded.trailer_seconds, art = excluded.art,
  scenes = excluded.scenes, members_count = excluded.members_count, rating = excluded.rating,
  demo = excluded.demo, published = excluded.published;
`;

await mkdir("supabase/seed", { recursive: true });
await writeFile("supabase/seed/demo_programs.sql", sql);
console.log(`ok: ${DEMO_PROGRAMS.length} programas -> supabase/seed/demo_programs.sql`);

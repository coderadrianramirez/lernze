import { revalidatePath } from "next/cache";

export function revalidateProgram(slug: string) {
  for (const p of [
    "/",
    "/buscar",
    "/ofertas",
    "/dashboard",
    `/programa/${slug}`,
    `/programa/${slug}/editar`,
    `/programa/${slug}/clases`,
    `/programa/${slug}/publicar`,
    `/aprender/${slug}`,
  ])
    revalidatePath(p);
}

import {notFound} from "next/navigation";
import {ProfileLinks} from "@/components/ProfileLinks";
import {ProfileBrandingEditor} from "@/components/ProfileBrandingEditor";
export default function ProfilePreview(){
 if(process.env.NODE_ENV!=="development")notFound();
 const links=["https://instagram.com/lernze","https://www.linkedin.com/company/lernze","https://www.tiktok.com/@lernze","https://x.com/lernze","https://ejemplo.com/mi-web"];
 return <main className="mx-auto max-w-4xl px-4 py-8"><p className="mb-6 rounded-xl border border-line p-3 text-xs text-muted">Prueba local de interfaz. Enlaces ficticios. No guardes cambios: esta vista no representa una cuenta. No existe en producción.</p><div className="overflow-hidden rounded-3xl border border-line bg-surface"><div className="aspect-[4/1] bg-[radial-gradient(ellipse_at_top_right,rgba(255,181,71,.25),transparent_70%)]"/><div className="p-5 sm:p-8"><h1 className="font-display text-3xl font-bold">Perfil de prueba</h1><ProfileLinks links={links}/><ProfileBrandingEditor bannerPath={null} links={links} ready/></div></div></main>;
}

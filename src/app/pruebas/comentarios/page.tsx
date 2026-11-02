import {notFound} from "next/navigation";
import {CommentsPreview} from "@/components/CommentsPreview";
import {NoTabBar} from "@/components/MobileTabBar";
export default function CommentPreviewPage(){
 if(process.env.NODE_ENV!=="development")notFound();
 return <main className="mx-auto max-w-[1000px] px-4 pb-16 pt-8"><NoTabBar/><p className="rounded-xl border border-accent/30 p-3 text-xs text-muted">Prueba local de interfaz. Datos ficticios, sin escrituras en Supabase. Esta ruta no existe en producción.</p><div className="mt-8"><span className="text-xs text-muted">CLASE 2 · TÉCNICA Y PRÁCTICA</span><h1 className="font-display text-3xl font-bold">La posición hace la diferencia</h1></div><CommentsPreview/></main>;
}

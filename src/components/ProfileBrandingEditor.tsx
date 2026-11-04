"use client";
import {useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {ConfirmDialog} from "./ConfirmDialog";
import {SocialIcon} from "./ProfileLinks";
import {bannerUrl} from "@/lib/profile";
import {profileLink,parseProfileLinks} from "@/lib/profile-links";
import {imageBlob} from "@/lib/browser-image";
import {createBannerUploadAction,discardBannersAction,saveBrandingAction} from "@/app/perfil/branding-actions";

export function ProfileBrandingEditor({bannerPath,links,ready}:{bannerPath:string|null;links:string[];ready:boolean}){
  const router=useRouter(),fileInput=useRef<HTMLInputElement>(null),uploads=useRef<string[]>([]);
  const [open,setOpen]=useState(false),[banner,setBanner]=useState(bannerPath),[urls,setUrls]=useState(links),[busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
  async function close(){if(busy)return;setBusy(true);setError("");try{if(uploads.current.length){const result=await discardBannersAction(uploads.current);if(result.error)throw Error(result.error);}uploads.current=[];setOpen(false);}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
  async function upload(file?:File){if(!file)return;if(!["image/jpeg","image/png","image/webp"].includes(file.type)||file.size>8*1024*1024){setError("Elige una imagen JPG, PNG o WebP de hasta 8 MB.");return;}
    if(uploads.current.length>=20){setError("Guarda o cancela antes de subir más imágenes.");return;}
    setBusy(true);setError("");try{const blob=await imageBlob(file,1920);if(blob.size>2*1024*1024)throw Error("La imagen es demasiado pesada. Elige otra más ligera.");
      const ticket=await createBannerUploadAction();if(!ticket.path||!ticket.signedUrl)throw Error(ticket.error||"No pudimos preparar tu banner.");
      const body=new FormData();body.append("",blob,"banner.webp");const response=await fetch(ticket.signedUrl,{method:"PUT",headers:{"x-upsert":"false"},body});if(!response.ok)throw Error("No pudimos subir tu banner. Inténtalo de nuevo.");
      uploads.current.push(ticket.path);setBanner(ticket.path);
    }catch(e){setError((e as Error).message);}finally{setBusy(false);if(fileInput.current)fileInput.current.value="";}
  }
  async function save(){if(busy)return;setError("");let parsed:string[];try{parsed=parseProfileLinks(urls.map(url=>url.trim()).filter(Boolean));}catch(e){setError((e as Error).message);return;}setBusy(true);
    try{const result=await saveBrandingAction({bannerPath:banner,links:parsed,uploads:uploads.current});if(result.error)throw Error(result.error);uploads.current=[];setOpen(false);setNotice(result.notice||"Banner y enlaces actualizados.");router.refresh();}catch(e){setError((e as Error).message);}finally{setBusy(false);}
  }
  return <div className="mt-4"><button type="button" onClick={()=>{setBanner(bannerPath);setUrls(links);setError("");setNotice("");setOpen(true);}} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-semibold text-muted transition-colors hover:border-accent hover:text-fg">✎ Banner y enlaces</button><p role="status" className="mt-1 text-xs text-good">{notice}</p>
    <ConfirmDialog open={open} busy={busy} title="Banner y enlaces" onClose={()=>void close()}><form onSubmit={event=>{event.preventDefault();void save();}} className="min-w-0">
      {!ready&&<p role="status" className="mb-4 rounded-xl border border-line p-3 text-sm text-muted">La personalización estará disponible en breve.</p>}
      <fieldset disabled={busy||!ready} className="min-w-0 disabled:opacity-60"><legend className="text-sm font-semibold">Banner del perfil</legend>
        <div className="relative mt-3 aspect-[4/1] overflow-hidden rounded-xl border border-line bg-[radial-gradient(ellipse_at_top_right,rgba(255,181,71,.2),transparent_70%)]">{bannerUrl(banner)&&<div role="img" aria-label="Vista previa de tu banner" className="h-full w-full bg-cover bg-center" style={{backgroundImage:`url("${bannerUrl(banner)}")`}}/>}</div>
        <p className="mt-2 text-xs leading-relaxed text-muted">Usa una imagen horizontal, idealmente de 1600 × 400 px. Se recorta desde el centro. Será pública en tu perfil.</p>
        <div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={()=>fileInput.current?.click()} className="min-h-11 rounded-xl border border-line px-3 py-2 text-sm font-semibold">{banner?"Cambiar banner":"Añadir banner"}</button>{banner&&<button type="button" onClick={()=>setBanner(null)} className="min-h-11 px-3 py-2 text-sm text-muted">Quitar banner</button>}</div>
        <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" aria-label="Selecciona tu banner" tabIndex={-1} className="sr-only" onChange={event=>void upload(event.target.files?.[0])}/>
      </fieldset>
      <fieldset disabled={busy||!ready} className="mt-6 min-w-0 disabled:opacity-60"><legend className="text-sm font-semibold">Redes y sitios web</legend><p className="mt-2 text-xs leading-relaxed text-muted">Hasta seis enlaces públicos. Reconocemos la plataforma por el dominio; esto no verifica la cuenta. Los demás sitios muestran un aviso al abrirlos.</p>
        <div className="mt-4 space-y-4">{urls.map((url,index)=>{const link=profileLink(url.trim());return <div key={index}><label htmlFor={`profile-link-${index}`} className="flex items-center gap-2 text-xs font-semibold"><SocialIcon platform={link?.platform??"Web"}/>{link?.platform??`Enlace ${index+1}`}</label><div className="mt-2 flex gap-2"><input id={`profile-link-${index}`} type="url" inputMode="url" autoComplete="url" maxLength={500} value={url} placeholder="https://…" onChange={event=>setUrls(old=>old.map((item,i)=>i===index?event.target.value:item))} className="min-w-0 flex-1 rounded-xl border border-line bg-surface-2 px-3 py-3 text-sm focus:border-accent focus:outline-none"/><button type="button" aria-label={`Quitar enlace ${index+1}`} onClick={()=>setUrls(old=>old.filter((_,i)=>i!==index))} className="min-h-11 min-w-11 rounded-xl border border-line text-lg text-muted hover:text-bad">×</button></div></div>;})}</div>
        {urls.length<6&&<button type="button" onClick={()=>setUrls(old=>[...old,""])} className="mt-3 min-h-11 text-sm font-bold text-accent">+ Añadir enlace</button>}
      </fieldset>
      {error&&<p role="alert" className="mt-4 text-sm text-bad">{error}</p>}<div className="mt-6 flex flex-wrap gap-2"><button disabled={busy||!ready} className="min-h-11 rounded-xl bg-accent px-4 py-3 text-sm font-bold text-accent-ink disabled:opacity-50">{busy?"Procesando…":"Guardar cambios"}</button><button type="button" disabled={busy} onClick={()=>void close()} className="min-h-11 rounded-xl border border-line px-4 py-3 text-sm disabled:opacity-50">Cancelar</button></div>
    </form></ConfirmDialog>
  </div>;
}

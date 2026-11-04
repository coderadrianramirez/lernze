"use client";
import {useState} from "react";
import {ConfirmDialog} from "./ConfirmDialog";
import {profileLink} from "@/lib/profile-links";

export function SocialIcon({platform}:{platform:string}){
  const common={width:18,height:18,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:1.7,"aria-hidden":true as const};
  if(platform==="Instagram")return <svg {...common}><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".8" fill="currentColor" stroke="none"/></svg>;
  if(platform==="LinkedIn")return <svg {...common}><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M7 10v7m0-10v.2M11 17v-7m0 3c0-4 6-4 6 0v4"/></svg>;
  if(platform==="TikTok")return <svg {...common}><path d="M14 3v12a4 4 0 1 1-4-4m4-8c0 4 3 6 6 6" strokeLinecap="round"/></svg>;
  if(platform==="X")return <svg {...common}><path d="m4 3 13 18h3L7 3H4Zm0 18 7-9m2-1 7-8"/></svg>;
  if(platform==="Facebook")return <svg {...common}><path d="M15 21v-8h3l.5-4H15V7c0-1 1-2 3-2h1V2h-3c-4 0-5 2-5 5v2H8v4h3v8"/></svg>;
  if(platform==="YouTube")return <svg {...common}><rect x="2" y="5" width="20" height="14" rx="4"/><path d="m10 9 5 3-5 3V9Z"/></svg>;
  return <svg {...common}><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/></svg>;
}
export function ProfileLinks({links}:{links:string[]}){
  const [destination,setDestination]=useState<ReturnType<typeof profileLink>>(null);
  const parsed=links.map(profileLink).filter(link=>link!==null);
  if(!parsed.length)return null;
  const style="group inline-flex min-h-11 max-w-full items-center gap-2 rounded-full border border-line bg-ink/50 px-3.5 py-2 text-sm text-muted transition-colors hover:border-accent/60 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent";
  return <><nav aria-label="Redes y sitios del perfil" className="mt-5 flex flex-wrap gap-2">{parsed.map(link=>link.social?<a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" aria-label={`${link.platform}: ${link.host} (abre otra pestaña)`} className={style}><SocialIcon platform={link.platform}/>{link.platform}<span aria-hidden="true" className="text-xs opacity-40 group-hover:opacity-100">↗</span></a>:<button type="button" key={link.url} onClick={()=>setDestination(link)} className={style}><SocialIcon platform="Web"/><span className="min-w-0 truncate">{link.host}</span><span aria-hidden="true" className="text-xs">↗</span></button>)}</nav>
    <ConfirmDialog open={Boolean(destination)} title="Vas a salir de Lernze" onClose={()=>setDestination(null)}><p className="text-sm leading-relaxed text-muted">Este enlace lleva a un sitio externo. Lernze no verifica su contenido.</p><p className="mt-3 break-all rounded-xl border border-line bg-ink p-3 text-sm">{destination?.host}</p><div className="mt-5 flex flex-wrap gap-2"><button type="button" onClick={()=>setDestination(null)} className="min-h-11 rounded-xl border border-line px-4 py-2 text-sm font-semibold">Quedarme aquí</button>{destination&&<a href={destination.url} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" onClick={()=>setDestination(null)} className="inline-flex min-h-11 items-center rounded-xl bg-accent px-4 py-2 text-sm font-bold text-accent-ink">Abrir sitio ↗</a>}</div></ConfirmDialog>
  </>;
}

"use client";
import {useRef,useState} from "react";
import type {CurrentUser} from "@/lib/auth";
import {ConfirmDialog} from "./ConfirmDialog";
import {ProfileForm} from "./ProfileForm";

export function ProfileQuickEdit({user,avatarPath,ready}:{user:CurrentUser;avatarPath:string|null;ready:boolean}){
 const [open,setOpen]=useState(false),[busy,setBusy]=useState(false),[notice,setNotice]=useState("");
 const form=useRef<HTMLFormElement>(null);
 return <div className="flex flex-col items-start gap-2 sm:items-end">
  <button type="button" onClick={()=>{setNotice("");setOpen(true);}} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line bg-ink px-5 py-3 text-sm font-bold transition-colors hover:border-accent"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m15 5 4 4M4 20l4-1 12-12a3 3 0 0 0-4-4L4 15v5Z"/></svg>Editar perfil</button>
  <p role="status" className="text-xs text-good">{notice}</p>
  <ConfirmDialog open={open} busy={busy} title="Editar tu perfil" onClose={()=>form.current?.reset()}>{open&&<ProfileForm user={user} avatarPath={avatarPath} ready={ready} formRef={form} onBusyChange={setBusy} onCancel={()=>{setOpen(false);setBusy(false);}} onSaved={()=>{setOpen(false);setBusy(false);setNotice("Perfil actualizado");}}/>}</ConfirmDialog>
 </div>;
}

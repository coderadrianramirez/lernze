"use client";
import Link from "next/link";
import {PasswordSettings} from "./PasswordSettings";
import {EmailSettings} from "./EmailSettings";
import {Avatar} from "@/components/Avatar";
import type {CurrentUser} from "@/lib/auth";
const panel="min-w-0 rounded-2xl border border-line bg-surface p-4 sm:p-6";
export function SettingsForms({user,interests,pendingEmail,hasPassword}:{user:CurrentUser;avatarPath:string|null;ready:boolean;interests:string[];pendingEmail:string|null;hasPassword:boolean|null}){
 return <div className="grid gap-5"><section className={panel}><h2 className="font-display text-xl font-bold">Tu perfil</h2><div className="mt-4 flex items-center gap-3"><Avatar name={user.name} src={user.avatarUrl}/><p className="min-w-0 break-words font-semibold">{user.name}</p></div><p className="mt-3 text-sm text-muted">Edita tu foto y nombre público desde Mi perfil.</p><Link href="/perfil" className="mt-3 inline-flex min-h-11 items-center text-sm font-bold text-accent">Ir a Mi perfil →</Link></section><section className={panel}><h2 className="font-display text-xl font-bold">Intereses</h2><p className="mt-2 text-sm text-muted">{interests.length?interests.join(" · "):"Explora programas para descubrir lo que te interesa."}</p><Link href="/intereses" className="mt-4 inline-flex min-h-11 items-center rounded-xl border border-line px-4 py-3 text-sm font-semibold hover:border-accent">Ver tus intereses</Link></section><EmailSettings email={user.email} pendingEmail={pendingEmail}/><PasswordSettings hasPassword={hasPassword} email={user.email}/></div>;
}

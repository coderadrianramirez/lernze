"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { ConfirmDialog } from "./ConfirmDialog";
import { CoinIcon, ProgramPrice } from "./ProgramPrice";
import { DEMO_COIN_PACKS, demoCoinPrice } from "@/lib/coins-demo";
import { addDemoCoins, resetDemoWallet, simulateUnlock, useDemoWallet } from "@/lib/demo-wallet";
import type { Course } from "@/lib/types";

export function CoinBalanceLink() {
  const wallet = useDemoWallet();
  return <Link href="/monedas" aria-label={`Monedas. Saldo de prueba: ${wallet.balance}`} className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border border-accent/25 bg-accent/5 px-2.5 text-sm font-bold text-accent transition-colors hover:border-accent"><CoinIcon/>{wallet.balance}<span className="text-[9px] font-medium text-muted">demo</span></Link>;
}

function RechargeOptions() {
  const packName = useId();
  const [selected, setSelected] = useState<number>(300);
  const [message, setMessage] = useState("");
  return <><fieldset><legend className="sr-only">Elige una recarga de prueba</legend><div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">{DEMO_COIN_PACKS.map(amount => <label key={amount} className={`flex cursor-pointer flex-col items-center gap-2 rounded-2xl border px-2 py-5 transition-colors focus-within:outline-2 focus-within:outline-offset-4 focus-within:outline-accent ${selected === amount ? "border-accent bg-accent/10 text-accent" : "border-line bg-ink text-muted hover:border-accent/50"}`}><input className="sr-only" type="radio" name={packName} value={amount} checked={selected === amount} onChange={() => setSelected(amount)}/><CoinIcon className="h-6 w-6"/><span className="font-display text-2xl font-extrabold">{amount}</span><span className="text-xs">monedas</span></label>)}</div></fieldset><p className="mt-3 text-xs text-muted">Importes de recarga por definir.</p><button type="button" onClick={() => setMessage(addDemoCoins(selected) ? `Sumaste ${selected} monedas de prueba a tu saldo.` : "Reinicia la demo para seguir probando.")} className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-bold text-accent-ink">Simular recarga <span aria-hidden="true">→</span></button><p role="status" className="mt-3 text-sm text-good">{message}</p></>;
}

export function CoinCheckout({ course, className = "" }: { course: Course; className?: string }) {
  const wallet = useDemoWallet();
  const [open, setOpen] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState("");
  const cost = demoCoinPrice(course);
  const unlocked = wallet.unlocked.includes(course.id);
  const missing = Math.max(0, cost - wallet.balance);

  return <><button type="button" onClick={() => { setCompleted(unlocked); setError(""); setOpen(true); }} className={`flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 font-bold text-accent-ink transition hover:brightness-110 ${className}`}><CoinIcon/>{unlocked ? "Ver simulación" : "Probar desbloqueo"}</button><ConfirmDialog open={open} title={completed ? "Simulación completada" : "Desbloquear programa"} onClose={() => setOpen(false)}>
    <p className="text-xs font-semibold uppercase tracking-wider text-accent">Demo de monedas</p><h3 className="mt-3 font-display text-xl font-bold leading-tight">{course.title}</h3><p className="mt-1 text-sm text-muted">{course.creatorName}</p>
    {completed ? <><div className="mt-6 rounded-2xl border border-good/30 bg-good/5 p-5"><p className="font-semibold text-good">Así se verá una compra con monedas.</p><p className="mt-2 text-sm leading-relaxed text-muted">Esta prueba actualiza el saldo de la demo. El acceso real al programa se habilitará cuando integremos los pagos.</p></div><p className="mt-4 text-sm text-muted">Saldo de prueba restante <b className="text-fg">{wallet.balance} monedas</b></p><button type="button" onClick={() => setOpen(false)} className="mt-5 min-h-11 w-full rounded-xl border border-line px-4 py-3 font-semibold">Seguir explorando</button></> : <>
      <dl className="mt-5 space-y-3 rounded-2xl border border-line bg-ink p-4 text-sm"><div className="flex justify-between gap-3"><dt className="text-muted">Precio de ejemplo</dt><dd className="font-bold text-accent"><ProgramPrice course={course}/></dd></div><div className="flex justify-between gap-3"><dt className="text-muted">Tu saldo de prueba</dt><dd>{wallet.balance} monedas</dd></div>{!missing && <div className="flex justify-between gap-3 border-t border-line pt-3"><dt className="text-muted">Te quedarían</dt><dd>{wallet.balance - cost} monedas</dd></div>}</dl>
      {missing ? <><p role="status" className="mt-4 text-sm text-muted">Te faltan <b className="text-fg">{missing} monedas</b>. Prueba una recarga para continuar.</p><RechargeOptions/></> : <button type="button" onClick={() => { if (simulateUnlock(course)) setCompleted(true); else setError("Revisa el saldo e inténtalo de nuevo."); }} className="mt-5 min-h-12 w-full rounded-xl bg-accent px-4 py-3 text-sm font-bold text-accent-ink">Simular desbloqueo · {cost} monedas</button>}
      <p className="mt-3 text-xs leading-relaxed text-muted">Prueba visual con monedas ficticias. Los precios son ilustrativos y no se realiza ningún cobro.</p>{error && <p role="alert" className="mt-3 text-sm text-bad">{error}</p>}<button type="button" onClick={() => setOpen(false)} className="mt-3 min-h-11 w-full text-sm text-muted">Cancelar</button>
    </>}
  </ConfirmDialog></>;
}

export function CoinWallet({ examples }: { examples: Course[] }) {
  const wallet = useDemoWallet();
  const [resetOpen, setResetOpen] = useState(false);
  return <><div className="flex flex-wrap items-end justify-between gap-3"><div><Link href="/descubrir" className="inline-flex min-h-11 items-center text-sm text-muted">← Volver a Descubrir</Link><h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">Tus monedas<span className="text-accent">.</span></h1></div><span className="rounded-full border border-accent/30 bg-accent/5 px-3 py-1.5 text-xs font-semibold text-accent">Vista de prueba</span></div><p className="mt-4 max-w-xl text-sm leading-relaxed text-muted">Explora cómo sería recargar saldo y desbloquear programas. El saldo es ficticio y los precios son ilustrativos.</p>
    <div className="mt-8 grid gap-5 lg:grid-cols-[.9fr_1.1fr]"><section className="relative overflow-hidden rounded-3xl border border-accent/25 bg-surface p-6 sm:p-8"><div className="pointer-events-none absolute -right-12 -top-16 h-56 w-56 rounded-full bg-accent/10 blur-3xl"/><p className="text-sm text-muted">Saldo disponible de prueba</p><p className="relative mt-6 flex flex-wrap items-center gap-3 font-display text-6xl font-extrabold text-accent"><CoinIcon className="h-10 w-10"/>{wallet.balance}</p><p className="mt-2 text-sm text-muted">monedas</p><div className="mt-9 border-t border-line pt-5"><p className="text-sm font-semibold">Aprende algo que te mueva</p><p className="mt-2 text-sm leading-relaxed text-muted">Elige un programa de ejemplo y prueba el recorrido con tu saldo.</p><Link href="#ejemplos" className="mt-4 inline-flex min-h-11 items-center text-sm font-bold text-accent">Explorar ejemplos ↓</Link></div></section><section className="rounded-3xl border border-line bg-surface p-6 sm:p-8"><h2 className="font-display text-2xl font-bold">Recarga a tu ritmo</h2><p className="mt-2 text-sm text-muted">Elige cuántas monedas quieres añadir a la demo.</p><RechargeOptions/></section></div>
    <section id="ejemplos" className="mt-10 scroll-mt-28"><h2 className="font-display text-2xl font-bold">Pruébalo en un programa</h2><p className="mt-2 text-sm text-muted">Estos son los mismos ejemplos que encuentras en el feed.</p><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{examples.map(course => <article key={course.id} className="flex min-w-0 flex-col rounded-2xl border border-line bg-surface p-5"><p className="text-xs font-semibold text-accent">{course.category}</p><Link href={`/programa/${course.slug}`} className="mt-3 font-display text-lg font-bold leading-snug hover:text-accent">{course.title}</Link><p className="mt-2 text-xs text-muted">{course.creatorName}</p><p className="mb-5 mt-5 text-xl font-bold"><ProgramPrice course={course}/></p><div className="mt-auto"><CoinCheckout course={course}/></div></article>)}</div></section>
    <section className="mt-10 rounded-2xl border border-line bg-surface p-5 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-display text-xl font-bold">Movimientos de prueba</h2><button type="button" onClick={() => setResetOpen(true)} className="min-h-11 text-sm text-muted hover:text-fg">Reiniciar demo</button></div>{wallet.movements.length ? <ul className="mt-3 divide-y divide-line">{wallet.movements.map(item => <li key={item.id} className="flex items-center justify-between gap-4 py-4 text-sm"><span className="min-w-0 break-words">{item.label}</span><span className={`shrink-0 font-bold ${item.amount > 0 ? "text-good" : "text-fg"}`}>{item.amount > 0 ? "+" : "−"}{Math.abs(item.amount)} <span className="text-xs font-normal text-muted">monedas</span></span></li>)}</ul> : <p className="py-5 text-sm text-muted">Tus recargas y desbloqueos simulados aparecerán aquí.</p>}</section><p className="mt-5 text-xs leading-relaxed text-muted">La demo se guarda en esta pestaña del navegador. Puedes reiniciarla cuando quieras.</p>
    <ConfirmDialog open={resetOpen} title="¿Reiniciar la demo?" onClose={() => setResetOpen(false)}><p className="text-sm text-muted">Volverás a tener 250 monedas de prueba y el historial de la demo quedará vacío.</p><div className="mt-5 flex flex-wrap gap-2"><button type="button" onClick={() => { resetDemoWallet(); setResetOpen(false); }} className="min-h-11 rounded-xl bg-accent px-4 py-3 text-sm font-bold text-accent-ink">Reiniciar</button><button type="button" onClick={() => setResetOpen(false)} className="min-h-11 rounded-xl border border-line px-4 py-3 text-sm">Cancelar</button></div></ConfirmDialog>
  </>;
}

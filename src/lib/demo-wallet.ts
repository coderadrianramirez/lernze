"use client";

import { useSyncExternalStore } from "react";
import { demoCoinPrice, hasDemoCoins, DEMO_COIN_PACKS } from "./coins-demo";
import type { Course } from "./types";

type Movement = { id: string; label: string; amount: number };
type Wallet = { balance: number; unlocked: string[]; movements: Movement[] };
const initial: Wallet = { balance: 250, unlocked: [], movements: [] };
const key = "lernze:coins:visual:v1";
const event = "lernze:coins:visual-change";
let snapshot: Wallet = initial;
let loaded = false;

function read() {
  if (loaded) return snapshot;
  loaded = true;
  try {
    const value = JSON.parse(sessionStorage.getItem(key) ?? "null");
    if (value && Number.isSafeInteger(value.balance) && value.balance >= 0 && value.balance <= 100000 &&
        Array.isArray(value.unlocked) && value.unlocked.every((id: unknown) => typeof id === "string") &&
        Array.isArray(value.movements) && value.movements.length <= 10 &&
        value.movements.every((item: Movement) => typeof item.id === "string" && typeof item.label === "string" && Number.isSafeInteger(item.amount))) {
      snapshot = value;
    }
  } catch { /* El prototipo sigue funcionando en memoria si el navegador bloquea Storage. */ }
  return snapshot;
}

function subscribe(listener: () => void) {
  window.addEventListener(event, listener);
  return () => window.removeEventListener(event, listener);
}

function update(wallet: Wallet) {
  snapshot = wallet;
  loaded = true;
  try { sessionStorage.setItem(key, JSON.stringify(wallet)); } catch {}
  window.dispatchEvent(new Event(event));
}

export function useDemoWallet() {
  return useSyncExternalStore(subscribe, read, () => initial);
}

export function addDemoCoins(amount: number) {
  if (!DEMO_COIN_PACKS.some(pack => pack === amount)) return false;
  const wallet = read();
  if (wallet.balance + amount > 100000) return false;
  update({ ...wallet, balance: wallet.balance + amount, movements: [{ id: crypto.randomUUID(), label: "Recarga de prueba", amount }, ...wallet.movements].slice(0, 10) });
  return true;
}

export function simulateUnlock(course: Course) {
  const wallet = read();
  const amount = demoCoinPrice(course);
  if (!hasDemoCoins(course) || wallet.unlocked.includes(course.id) || wallet.balance < amount) return false;
  update({ balance: wallet.balance - amount, unlocked: [...wallet.unlocked, course.id], movements: [{ id: crypto.randomUUID(), label: course.title, amount: -amount }, ...wallet.movements].slice(0, 10) });
  return true;
}

export function resetDemoWallet() {
  update(initial);
}

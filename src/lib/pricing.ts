import type { SaleOrigin } from "./types";

/** Comisión de plataforma por origen de la venta, en puntos base (100 = 1%). */
export const COMMISSION_BPS: Record<SaleOrigin, number> = {
  own: 0,
  agent: 300,
  discover: 500,
};

export const AGENT_SUBSCRIPTION_CENTS = 4900;

export function commissionCents(grossCents: number, origin: SaleOrigin): number {
  return Math.round((grossCents * COMMISSION_BPS[origin]) / 10_000);
}

export function formatPrice(cents: number, currency = "USD"): string {
  return new Intl.NumberFormat("es-US", {
    style: "currency",
    currency,
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function parseOrigin(value: string | string[] | undefined): SaleOrigin {
  const v = Array.isArray(value) ? value[0] : value;
  return v === "discover" || v === "agent" ? v : "own";
}

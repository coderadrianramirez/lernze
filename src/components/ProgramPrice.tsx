import { formatPrice } from "@/lib/pricing";
import { demoCoinPrice, hasDemoCoins } from "@/lib/coins-demo";
import type { Course } from "@/lib/types";

export function CoinIcon({ className = "h-4 w-4" }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="6.5" opacity=".35"/><path d="m12 7 3 5-3 5-3-5 3-5Z"/></svg>;
}

export function programPriceText(course: Course) {
  return hasDemoCoins(course) ? `${demoCoinPrice(course)} monedas de prueba` : formatPrice(course.priceCents, course.currency);
}

export function ProgramPrice({ course }: { course: Course }) {
  if (!hasDemoCoins(course)) return <>{formatPrice(course.priceCents, course.currency)}</>;
  return <span className="inline-flex items-center gap-1.5 whitespace-nowrap" aria-label={`${demoCoinPrice(course)} monedas de prueba`} title="Precio ilustrativo en monedas de prueba"><CoinIcon className="h-[.85em] w-[.85em] shrink-0"/>{demoCoinPrice(course)}</span>;
}

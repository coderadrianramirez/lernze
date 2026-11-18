import { Suspense } from "react";
import type { Metadata } from "next";
import { CoinWallet } from "@/components/CoinExperience";
import { listCourses } from "@/lib/data";
import { hasDemoCoins } from "@/lib/coins-demo";
import { ShowFooterOnMobile } from "@/components/Footer";

export const metadata: Metadata = { title: "Monedas · Demo", description: "Prueba visual de monedas para explorar programas de Lernze." };

export default function CoinsPage() {
  return <main className="mx-auto max-w-5xl px-4 pb-12 pt-6 sm:px-6 sm:pt-10"><ShowFooterOnMobile/><Suspense fallback={<p role="status" className="py-12 text-muted">Preparando tus monedas de prueba…</p>}><Examples/></Suspense></main>;
}

async function Examples() {
  const courses = await listCourses();
  const examples = courses.filter(course => course.published && hasDemoCoins(course)).sort((a, b) => a.priceCents - b.priceCents).slice(0, 6);
  return <CoinWallet examples={examples}/>;
}

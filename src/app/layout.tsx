import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, DM_Sans } from "next/font/google";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { MobileTabBar } from "@/components/MobileTabBar";
import { NOUN } from "@/lib/copy";
import "./globals.css";
import "./stage.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["500", "700", "800"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "Lernze", template: "%s · Lernze" },
  appleWebApp: { capable: true, title: "Lernze", statusBarStyle: "black-translucent" },
  description:
    `Vende ${NOUN.other} y comunidades, y deja que Lernze te muestre a compradores nuevos con trailers y clips.`,
};

export const viewport: Viewport = {
  themeColor: "#0d0e14",
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" data-scroll-behavior="smooth" className={`${bricolage.variable} ${dmSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <Header />
        <div className="flex-1">{children}</div>
        <Footer />
        <MobileTabBar />
      </body>
    </html>
  );
}

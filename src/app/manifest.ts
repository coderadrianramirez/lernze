import type { MetadataRoute } from "next";

/** Permite instalar Lernze en la pantalla de inicio del teléfono como una app. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Lernze",
    short_name: "Lernze",
    description: "Programas de creadores reales: mira el trailer, elige y únete a su comunidad.",
    start_url: "/",
    display: "standalone",
    background_color: "#0d0e14",
    theme_color: "#0d0e14",
    lang: "es",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}

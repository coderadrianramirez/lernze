import type { Category } from "./types";

/** Color, ícono (trazo SVG 24×24) y frase corta de cada categoría. */
export const CATEGORY_META: Record<Category, { glow: string; icon: string; hint: string }> = {
  Negocios: { glow: "#ffb547", icon: "M4 8h16v11H4zM9 8V5h6v3", hint: "Emprender y vender" },
  Idiomas: { glow: "#7fd6c8", icon: "M4 5h16v11H9l-5 4z", hint: "Hablar con confianza" },
  Oficios: { glow: "#ff9ad5", icon: "M6 4l4 4-6 6 4 4 6-6 4 4", hint: "Manos a la obra" },
  Marketing: { glow: "#ff6ea8", icon: "M4 10v4h3l6 4V6L7 10zM17 9a4 4 0 0 1 0 6", hint: "Contenido que vende" },
  Inversión: { glow: "#6fd38b", icon: "M4 18l5-6 4 3 7-9M15 6h5v5", hint: "Que tu dinero trabaje" },
};

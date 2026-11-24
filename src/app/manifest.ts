import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MyBudget · Dinero en equipo",
    short_name: "MyBudget",
    description: "Tus gastos personales y compartidos, claros en un solo lugar.",
    start_url: "/",
    display: "standalone",
    background_color: "#fffdf6",
    theme_color: "#faf0ca",
    lang: "es-MX",
    icons: [
      {
        src: "/app-icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/app-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}

import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FuerzaVerificada - Portal de Empleo & Seguridad",
    short_name: "FuerzaVerificada",
    description:
      "Portal de empleo, relevos 24/7 y estudios de seguridad privada en Colombia.",
    start_url: "/",
    display: "standalone",
    background_color: "#F2F5F8",
    theme_color: "#0B3B70",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icon-192",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-192",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}

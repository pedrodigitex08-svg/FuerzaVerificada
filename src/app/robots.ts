import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://fuerza-verificada.vercel.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/guarda/vacantes",
          "/privacidad",
          "/terminos",
          "/precios-empresas",
          "/login",
        ],
        disallow: [
          "/admin/",
          "/admin/*",
          "/empresa/",
          "/empresa/*",
          "/mi-perfil/",
          "/mi-perfil/*",
          "/candidato/",
          "/candidato/*",
          "/guarda/perfil",
          "/guarda/documentos",
          "/guarda/postulaciones",
          "/guarda/onboarding",
          "/auth/",
          "/auth/*",
          "/actualizar-password",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

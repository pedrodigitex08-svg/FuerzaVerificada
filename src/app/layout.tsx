import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { CookieBanner } from "@/components/CookieBanner";
import { Analytics } from "@/components/Analytics";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://fuerza-verificada.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "FuerzaVerificada | Portal de Empleo y Confiabilidad en Seguridad Privada",
    template: "%s | FuerzaVerificada",
  },
  description:
    "Ecosistema vertical de contratación, ATS y verificación con poligrafía y visitas domiciliarias para el sector de la seguridad y vigilancia privada en Colombia. Conexión directa para vigilantes, escoltas, supervisores y operadores de medios tecnológicos.",
  keywords: [
    "seguridad privada colombia",
    "empleo vigilantes bogota",
    "vigilancia privada decreto 356",
    "empleo escoltas",
    "superintendencia de vigilancia",
    "poligrafia laboral colombia",
    "visitas domiciliarias seguridad",
    "estudios de confiabilidad",
    "relevos de seguridad 24/7",
    "FuerzaVerificada",
  ],
  authors: [{ name: "FuerzaVerificada", url: siteUrl }],
  creator: "FuerzaVerificada",
  publisher: "FuerzaVerificada",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "FuerzaVerificada | Portal de Empleo y Confiabilidad en Seguridad Privada",
    description:
      "Plataforma de selección y verificación operativa para el sector de la seguridad privada en Colombia. Expedientes auditados, poligrafía y vacantes vigentes.",
    url: siteUrl,
    siteName: "FuerzaVerificada",
    locale: "es_CO",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FuerzaVerificada | Portal de Empleo y Confiabilidad en Seguridad Privada",
    description:
      "Plataforma de selección y verificación operativa para el sector de la seguridad privada en Colombia. Expedientes auditados, poligrafía y vacantes vigentes.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={jakarta.variable}>
      <body className="font-sans antialiased bg-white text-[#1E293B] selection:bg-[#0F172A] selection:text-white">
        {children}
        <CookieBanner />
        <Analytics />
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { DemoRoleSwitcher } from "@/components/ui/DemoRoleSwitcher";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "FuerzaVerificada — Plataforma B2B de Selección y Confiabilidad Operativa",
  description:
    "Ecosistema vertical de contratación, ATS y verificación con poligrafía y visitas domiciliarias para el sector de la seguridad y vigilancia privada en Colombia.",
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
        <DemoRoleSwitcher />
      </body>
    </html>
  );
}

import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt =
  "FuerzaVerificada — Plataforma de Empleo Verificado y Confiabilidad en Seguridad Privada";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px 70px",
          backgroundColor: "#0F172A",
          backgroundImage:
            "radial-gradient(circle at 90% 10%, rgba(16, 185, 129, 0.15) 0%, transparent 40%), radial-gradient(circle at 10% 90%, rgba(30, 41, 59, 0.8) 0%, transparent 50%)",
          color: "#FFFFFF",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {/* Top Header: Brand */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "14px",
                backgroundColor: "#1E293B",
                border: "1px solid #334155",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                <path d="m9 12 2 2 4-4" stroke="#10B981" strokeWidth="2.5" />
              </svg>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "28px", fontWeight: 700, letterSpacing: "-0.5px" }}>
                Fuerza<span style={{ color: "#10B981" }}>Verificada</span>
              </span>
              <span
                style={{
                  fontSize: "13px",
                  color: "#94A3B8",
                  textTransform: "uppercase",
                  letterSpacing: "1.5px",
                  fontWeight: 600,
                  marginTop: "2px",
                }}
              >
                Red Nacional de Seguridad · Colombia
              </span>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 16px",
              backgroundColor: "rgba(16, 185, 129, 0.1)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              borderRadius: "8px",
              color: "#34D399",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            <span>● Verificación Oficial</span>
          </div>
        </div>

        {/* Center: Main Statement */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "980px" }}>
          <h1
            style={{
              fontSize: "52px",
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: "-1.5px",
              color: "#F8FAFC",
              margin: 0,
            }}
          >
            Plataforma de Empleo Verificado y Estudios de Confiabilidad
          </h1>
          <p
            style={{
              fontSize: "22px",
              lineHeight: 1.4,
              color: "#94A3B8",
              margin: 0,
            }}
          >
            Conectamos personal operativo certificado (vigilantes, escoltas, operadores de medios) con empresas de seguridad privada bajo el Decreto 356 de 1994 y poligrafía con custodia en cadena.
          </p>
        </div>

        {/* Bottom: Feature Badges */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
            paddingTop: "24px",
            borderTop: "1px solid #334155",
          }}
        >
          <div
            style={{
              padding: "10px 18px",
              backgroundColor: "#1E293B",
              border: "1px solid #334155",
              borderRadius: "8px",
              color: "#E2E8F0",
              fontSize: "14px",
              fontWeight: 600,
            }}
          >
            🛡️ Acreditación SuperVigilancia
          </div>

          <div
            style={{
              padding: "10px 18px",
              backgroundColor: "#1E293B",
              border: "1px solid #334155",
              borderRadius: "8px",
              color: "#E2E8F0",
              fontSize: "14px",
              fontWeight: 600,
            }}
          >
            📋 Poligrafía & Visitas Domiciliarias
          </div>

          <div
            style={{
              padding: "10px 18px",
              backgroundColor: "#1E293B",
              border: "1px solid #334155",
              borderRadius: "8px",
              color: "#E2E8F0",
              fontSize: "14px",
              fontWeight: 600,
            }}
          >
            ⚡ Radar de Relevos 24/7
          </div>

          <div
            style={{
              padding: "10px 18px",
              backgroundColor: "#1E293B",
              border: "1px solid #334155",
              borderRadius: "8px",
              color: "#34D399",
              fontSize: "14px",
              fontWeight: 600,
              marginLeft: "auto",
            }}
          >
            Cero Cobros a Candidatos
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}

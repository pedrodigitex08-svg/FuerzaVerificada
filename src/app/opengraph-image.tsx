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
          backgroundColor: "#0B3B70",
          backgroundImage:
            "radial-gradient(circle at 90% 15%, rgba(0, 93, 164, 0.45) 0%, transparent 45%), radial-gradient(circle at 10% 85%, rgba(8, 43, 84, 0.9) 0%, transparent 50%)",
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
                backgroundColor: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
              }}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#0B3B70"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                <path d="m9 12 2 2 4-4" stroke="#005DA4" strokeWidth="2.5" />
              </svg>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "30px", fontWeight: 800, letterSpacing: "-0.5px" }}>
                Fuerza<span style={{ color: "#EAF3FA" }}>Verificada</span>
              </span>
              <span
                style={{
                  fontSize: "13px",
                  color: "#EAF3FA",
                  textTransform: "uppercase",
                  letterSpacing: "1.5px",
                  fontWeight: 600,
                  marginTop: "2px",
                  opacity: 0.9,
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
              padding: "10px 20px",
              backgroundColor: "rgba(234, 243, 250, 0.15)",
              border: "1px solid rgba(234, 243, 250, 0.35)",
              borderRadius: "9999px",
              color: "#FFFFFF",
              fontSize: "14px",
              fontWeight: 700,
            }}
          >
            <span>● Verificación Oficial SuperVigilancia</span>
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
              color: "#FFFFFF",
              margin: 0,
            }}
          >
            Plataforma de Empleo Verificado y Estudios de Confiabilidad
          </h1>
          <p
            style={{
              fontSize: "22px",
              lineHeight: 1.4,
              color: "#EAF3FA",
              margin: 0,
              opacity: 0.92,
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
            borderTop: "1px solid rgba(234, 243, 250, 0.2)",
          }}
        >
          <div
            style={{
              padding: "12px 20px",
              backgroundColor: "#EAF3FA",
              borderRadius: "9999px",
              color: "#0B3B70",
              fontSize: "14px",
              fontWeight: 700,
            }}
          >
            🛡️ Acreditación SuperVigilancia
          </div>

          <div
            style={{
              padding: "12px 20px",
              backgroundColor: "#EAF3FA",
              borderRadius: "9999px",
              color: "#0B3B70",
              fontSize: "14px",
              fontWeight: 700,
            }}
          >
            📋 Poligrafía & Visitas Domiciliarias
          </div>

          <div
            style={{
              padding: "12px 20px",
              backgroundColor: "#EAF3FA",
              borderRadius: "9999px",
              color: "#0B3B70",
              fontSize: "14px",
              fontWeight: 700,
            }}
          >
            ⚡ Radar de Relevos 24/7
          </div>

          <div
            style={{
              padding: "12px 22px",
              backgroundColor: "#005DA4",
              borderRadius: "9999px",
              color: "#FFFFFF",
              fontSize: "14px",
              fontWeight: 700,
              marginLeft: "auto",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
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

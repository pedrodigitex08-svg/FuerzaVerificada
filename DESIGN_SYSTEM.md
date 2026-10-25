# Sistema de Diseño Corporativo: FuerzaVerificada (Estándar B2B GovTech & Seguridad)

Este documento define las directrices permanentes de arquitectura visual, interfaz de usuario (UI) y experiencia de usuario (UX) para **FuerzaVerificada**. Su objetivo es garantizar una estética institucional, sobria y de alta precisión inspirada en estándares de ingeniería de producto de clase mundial (Linear / Stripe / Palantir), erradicando cualquier patrón visual genérico o "cliché de IA".

---

## 1. Regla Anti-Clichés de IA ("Zero AI-Look Policy")

* **Geometría de Bordes Ejecutiva:**
  * **Prohibido** el uso de radios exagerados (`rounded-3xl`, `rounded-2xl`) en tarjetas operativas, tablas, modales o controles de formulario.
  * **Contenedores y Tarjetas Principales:** Estandarizar estrictamente a `rounded-lg` (`8px`).
  * **Inputs, Selectores, Botones y Badges:** Estandarizar a `rounded-md` (`6px`).
* **Superficies y Sombras Técnicas:**
  * **Prohibido** el uso de degradados saturados o neón, sombras difusas pesadas (`shadow-2xl`, `shadow-xl`) y animaciones de rebote innecesarias.
  * Utilizar elevación sutil de precisión: `shadow-[0_1px_2px_rgba(15,23,42,0.04)]` combinada con bordes definidos de `1px`.
* **Iconografía Sobria:**
  * **Prohibido** el uso de emojis genéricos en títulos, botones o estados del sistema.
  * Emplear exclusivamente iconografía vectorial técnica (`lucide-react`) con trazos uniformes (`strokeWidth={1.5}` o `1.75`) y dimensiones contenidas (`w-4 h-4`).

---

## 2. Paleta Ejecutiva de Alta Precisión

| Token / Propósito | Clase Tailwind / Valor Hex | Uso Autorizado |
| :--- | :--- | :--- |
| **Fondo Base (Canvas)** | `bg-[#F8FAFC]` / `bg-slate-50/70` | Fondo general de paneles operativos, dashboards y áreas de trabajo. |
| **Superficie Primaria** | `bg-white` (`#FFFFFF`) | Tarjetas de vacantes, tablas ATS, contenedores de formularios y modales. |
| **Borde Técnico (1px)** | `border-slate-200/90` (`#E2E8F0`) | Delimitación estructural de tarjetas, celdas de tabla, divisores e inputs. |
| **Primario Corporativo** | `bg-[#0F172A]` (`slate-900`) | Botones de acción principal, cabeceras institucionales y navegación activa. |
| **Hover Corporativo** | `hover:bg-slate-800` | Interacción sobria sobre controles primarios. |
| **Texto Principal** | `text-slate-900` (`#0F172A`) | Títulos, nombres de empresas/candidatos y cifras clave. |
| **Texto Secundario** | `text-slate-600` / `text-slate-500` | Subtítulos, metadatos operativos y etiquetas descriptivas. |
| **Semántica de Verificación** | `bg-emerald-50/80 text-emerald-700 border-emerald-200/60` | **Exclusivo** para estados verificados reales (SuperVigilancia, Poligrafía OK, Antecedentes OK, Curso Vigente). |
| **Semántica de Alerta / B2B** | `bg-amber-50/80 text-amber-800 border-amber-200/70` | Estados pendientes de validación, alertas de vencimiento próximo y créditos corporativos. |
| **Semántica de Riesgo / Error** | `bg-rose-50/80 text-rose-700 border-rose-200/70` | Cursos vencidos, rechazos por riesgo o errores de validación. |

---

## 3. Tipografía y Datos Técnicos (`tabular-nums`)

* **Jerarquía Tipográfica:**
  * Títulos de página y sección con `tracking-tight` y peso `font-semibold` (evitar `font-black` o textos en mayúsculas sostenidas que reduzcan la legibilidad).
  * Subtítulos y descripciones en `text-xs` o `text-sm` con `text-slate-500` y `leading-relaxed`.
* **Rigor Numérico y Financiero (`tabular-nums`):**
  * **Obligatorio** aplicar la clase `tabular-nums` en todos los datos cuantitativos y de identificación:
    * NITs empresariales y números de licencia SuperVigilancia (`font-mono text-xs tabular-nums`).
    * Cédulas de ciudadanía y números de credencial (`font-mono text-xs tabular-nums`).
    * Teléfonos y líneas WhatsApp (`tabular-nums`).
    * Salarios mensuales, precios de planes B2B y recargas (`tabular-nums`).
    * Contadores de KPIs, porcentajes de compatibilidad y días restantes de vigencia (`tabular-nums`).

---

## 4. Densidad Corporativa en Controles y Componentes

* **Inputs y Selectores de Formulario:**
  * Altura compacta y uniforme: `h-10` (`40px`) o `h-11` (`44px`).
  * Geometría y espaciado: `rounded-md border border-slate-200/90 bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400`.
  * Estado de foco ejecutivo: `focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-colors`.
* **Botones Operativos:**
  * Altura estándar: `h-9` o `h-10`, `px-4`, `rounded-md`, `text-xs` o `text-sm font-medium`.
  * Transiciones limpias de `150ms` (`transition-colors`), sin escalados bruscos.
* **Tablas y Listados ATS:**
  * Cabeceras de tabla sobrias: `bg-slate-50/80 border-b border-slate-200/90 text-[11px] font-semibold uppercase tracking-wider text-slate-500`.
  * Filas con hover sutil: `hover:bg-slate-50/60 transition-colors divide-y divide-slate-200/70`.
* **Barra de Navegación (`Navbar`):**
  * Fija en la parte superior con efecto cristal técnico: `sticky top-0 z-50 backdrop-blur-md bg-white/90 border-b border-slate-200/80`.

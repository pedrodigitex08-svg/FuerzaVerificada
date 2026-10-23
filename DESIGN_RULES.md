# DESIGN RULES: FUERZAVERIFICADA
**Modo Claro Premium / Apple & SaaS Corporate Aesthetic (Render Oficial Aprobado)**

Este documento establece el estándar visual y las directrices de diseño corporativo obligatorias para todos los módulos de **FuerzaVerificada** (`/`, `/guarda/*`, `/empresa/*`, `/admin/*`).

---

## 1. PALETA CROMÁTICA OFICIAL (LIGHT MODE CORPORATIVO)

| Propósito | Hexadecimal | Clases Tailwind / Variables | Uso Exclusivo |
| :--- | :--- | :--- | :--- |
| **Fondo Principal** | `#FFFFFF` | `bg-white` | Lienzo principal, tarjetas primarias, modales y drawers. |
| **Fondo Contenedores** | `#F8FAFC` | `bg-[#F8FAFC]` / `bg-slate-50` | Contenedores secundarios, fondos de sección y workspaces. |
| **Tags / Chips Suaves** | `#F3F4F6` | `bg-[#F3F4F6]` / `bg-gray-100` | Píldoras de turnos, requisitos, ciudad y badges técnicos. |
| **Acento de Autoridad** | `#0F172A` | `bg-[#0F172A]` / `hover:bg-[#1E3A8A]` | Botones de acción principal (CTA), headers ejecutivos, sidebar SuperAdmin. |
| **Hover Autoridad** | `#1E3A8A` | `hover:bg-[#1E3A8A]` / `text-[#1E3A8A]` | Estados hover y énfasis tipográfico en títulos. |
| **Verificación Institucional** | `#10B981` | `text-[#10B981]` / `bg-[#10B981]` | **Exclusivamente** para: Perfil Verificado, Empresa Verificada, Antecedentes OK, Curso Vigente y Dictámenes Aprobados de Poligrafía/Visita. |
| **Fondo Verificación** | `#ECFDF5` | `bg-[#ECFDF5]` / `border-[#10B981]/30` | Banners de credencial validada y estados aprobados. |
| **Texto Verificación** | `#065F46` | `text-[#065F46]` | Textos sobre fondos de verificación suave. |
| **Bordes & Divisores** | `#E2E8F0` | `border-[#E2E8F0]` / `border-slate-200` | Bordes tenues en todas las tarjetas, tablas e inputs. |
| **Texto Títulos** | `#1E293B` | `text-[#1E293B]` / `text-slate-800` | Encabezados H1, H2, H3 y nombres de candidatos/empresas. |
| **Texto Secundario** | `#64748B` | `text-[#64748B]` / `text-slate-500` | Metadatos, fechas, cédulas y descripciones. |

---

## 2. REGLAS ESTRUCTURALES Y TIPOGRAFÍA

1. **Tipografía y Números:**
   - Fuente base: `Inter` o `Plus Jakarta Sans`.
   - Números de salarios, días restantes de vigencia, porcentajes de match y conteos: **Obligatorio** aplicar `tabular-nums font-semibold` o `font-bold` para perfecta alineación vertical.
2. **Esquinas & Radios:**
   - Contenedores grandes, tarjetas y modales: `rounded-xl` (o `rounded-2xl` para contenedores macro).
   - Badges y Chips: `rounded-lg` o `rounded-full` según jerarquía.
3. **Iconografía Vectorial Limpia:**
   - **Exclusivamente** íconos de `lucide-react` con `strokeWidth={1.5}`.
   - **PROHIBIDO el uso de emojis** en la interfaz (nada de 🟢, 🟡, 🔴, 🛡️, ⚠️). Utilizar indicadores de punto `w-2 h-2 rounded-full` o íconos SVG dedicados (`Shield`, `CheckCircle`, `Lock`, `MapPin`, `Clock`).
4. **Micro-interacciones:**
   - Transiciones: `transition-all duration-200`.
   - Tarjetas interactivas: `hover:-translate-y-0.5 hover:shadow-md`.
   - Sombras: Sutiles y orgánicas (`shadow-sm`, `shadow-md`, `shadow-lg` de elevación suave).

---

## 3. ANATOMÍA DE TARJETAS (JOB CARDS & CANDIDATE CREDENTIALS)

- **Job Card B2B:**
  - Header: Avatar de iniciales en `bg-[#F3F4F6] border border-[#E2E8F0] rounded-xl`, Razón Social, Badge verde `<CheckCircle className="w-3.5 h-3.5 text-[#10B981]" /> Empresa Verificada`, Badge lateral `XX% Compatible`.
  - Tags centrales: Chips en `bg-[#F3F4F6] text-[#1E293B] rounded-lg px-3 py-1 text-xs font-medium` para Rol (`<Shield strokeWidth={1.5} />`), Ubicación (`<MapPin strokeWidth={1.5} />`) y Salario en negrita.
  - Footer con línea divisoria `border-t border-[#E2E8F0]`: Indicador de confianza `<Lock className="w-3.5 h-3.5 text-[#10B981]" /> Incluye Polígrafo sin costo al guarda` y botón de postulación `bg-[#0F172A] hover:bg-[#1E3A8A] text-white rounded-xl`.

- **Candidate Credential Card:**
  - Cabecera de credencial con foto/avatar oficial, nombre verificado con `<CheckCircle className="text-[#10B981]" />`, cargo principal y años de experiencia.
  - Banner verde institucional `bg-[#ECFDF5] border border-[#10B981]/30 rounded-xl p-3.5` con leyenda `PERFIL VERIFICADO • CURSO VIGENTE` y badge blanco `Antecedentes OK`.
  - Bloques de badges técnicos en `bg-[#F3F4F6] text-[#1E293B]`.
  - Grid de 3 cajas de Verificación Avanzada: `Estudio Seg.: Aprobado`, `Visita Domicil.: Realizada`, `Poligrafía: Sin Novedad`.
  - Botones de acción: `Hoja de Vida PDF` (borde tenue) y `Solicitar Polígrafo / Visita` (`bg-[#0F172A]`).

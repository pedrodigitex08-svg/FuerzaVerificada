# SYSTEM SPECIFICATION & PRD: "FUERZAVERIFICADA" (MVP v1.0)
**Vertical Job Board, ATS & B2B Background Check / Polygraph Platform for the Private Security Sector in Colombia**

## 1. ROL E INSTRUCCIONES PARA EL AGENTE DE IA (ANTIGRAVITY)
Actúa como un Arquitecto de Software Senior y Desarrollador Full-Stack experto en **Next.js 14+ (App Router), TypeScript, Tailwind CSS, Lucide Icons y Supabase (PostgreSQL, Auth, Storage, RLS)**.
Tu objetivo es construir un MVP funcional, seguro, limpio y listo para producción en Colombia llamado **FuerzaVerificada**.

### Reglas de Oro de Ingeniería:
1. **Mobile-First para Candidatos:** El 95% de los guardas, vigilantes y escoltas entran desde celulares Android de gama media/baja. La interfaz `/guarda/*` debe parecer una App nativa (PWA), con botones grandes (mín. 48px de alto), uso de "Chips" seleccionables en lugar de textos largos, y bajo consumo de datos.
2. **Desktop-First para Empresas y Admin:** Las rutas `/empresa/*` y `/admin/*` son paneles de control operativos (ATS y Gestión de Estudios de Seguridad/Poligrafía).
3. **Doble formato de Hoja de Vida:** El candidato llena su perfil estructurado rápido (para filtros automáticos) PERO también debe poder adjuntar su Hoja de Vida en PDF/Word tradicional (como en Computrabajo) más los soportes de su Curso de Vigilancia y Cédula.
4. **Integración Nativa B2B (Diferenciador Clave):** El propietario de la plataforma posee una empresa de **Estudios de Seguridad, Visitas Domiciliarias y Poligrafía**. Las empresas clientes compran paquetes de vacantes que incluyen créditos para estos servicios y los solicitan con 1 clic desde la lista de postulados.

---

## 2. IDENTIDAD VISUAL Y SISTEMA DE DISEÑO (TAILWIND CSS)
Configura o utiliza las siguientes clases y variables de color consistentemente:
- **Primary (Tactical Navy):** `bg-slate-900` (`#0F172A`), texto `text-slate-900`. Representa autoridad e institucionalidad (SuperVigilancia).
- **Accent / Trust (Gold Shield):** `bg-amber-500` / `text-amber-600` (`#D97706`). Para sellos de "Empresa Verificada", "Paquete Poligrafía/Estudio" y alertas de valor.
- **Success / Action (Operational Emerald):** `bg-emerald-600` hover `bg-emerald-700` (`#10B981`). Para "Disponible para Relevo Hoy", "Curso Vigente", "Postularme en 1 Clic" y WhatsApp.
- **Danger / Expired:** `bg-rose-600` (`#E11D48`). Para "Curso Vencido" o "No Aprobado en Estudio".
- **Backgrounds:** `bg-slate-50` (`#F8FAFC`) para el fondo general y `bg-white` con `border-slate-200` y `shadow-sm` para tarjetas.
- **Tipografía:** `Inter` o `Plus Jakarta Sans`. Números de salarios y días de vigencia del curso en fuente semibold/bold de alto contraste.

---

## 3. ARQUITECTURA DE BASE DE DATOS (SUPABASE SQL - YA CREADA EN EL PROYECTO)
La base de datos en Supabase ya tiene ejecutadas las siguientes tablas y vistas:
- `public.profiles` (`id`, `role` ['candidate'|'company'|'admin'], `full_name`, `phone_whatsapp`, `email`, `created_at`, `updated_at`)
- `public.candidate_profiles` (`user_id`, `national_id`, `city`, `locality_neighborhood`, `address`, `birth_date`, `primary_role`, `years_experience`, `has_military_booklet`, `has_own_motorcycle`, `motorcycle_cc`, `has_driving_license`, `license_category`, `has_weapon_permit_experience`, `available_immediately`, `bio_summary`, `work_experience_json`, `resume_pdf_url`, `updated_at`)
- `public.candidate_courses` (`id`, `candidate_id`, `course_name`, `academy_name`, `nro_credencial_supervigilancia`, `completion_date`, `expiration_date`, `certificate_file_url`, `is_verified_by_admin`, `created_at`)
- `public.candidate_documents` (`id`, `candidate_id`, `doc_type`, `file_url`, `uploaded_at`)
- `public.companies` (`id`, `owner_id`, `company_name`, `nit`, `supervigilancia_license`, `city`, `address`, `contact_person`, `contact_phone`, `logo_url`, `is_verified_company`, `plan_name`, `credits_security_studies`, `created_at`)
- `public.job_posts` (`id`, `company_id`, `title`, `role_required`, `city`, `zone_neighborhood`, `shift`, `salary_monthly`, `includes_surcharges`, `requires_active_course`, `requires_motorcycle`, `min_motorcycle_cc`, `requires_military_booklet`, `min_experience_years`, `is_strict_filter`, `is_urgent_relief`, `description`, `interview_address`, `is_active`, `created_at`)
- `public.applications` (`id`, `job_id`, `candidate_id`, `match_score`, `status` ['postulado'|'preseleccionado'|'citado_entrevista'|'en_estudio_seguridad'|'contratado'|'descartado'], `recruiter_notes`, `created_at`, `updated_at`)
- `public.security_study_orders` (`id`, `company_id`, `candidate_id`, `application_id`, `include_polygraph`, `include_home_visit`, `include_background_study`, `status` ['solicitado'|'agendado'|'en_proceso'|'aprobado'|'rechazado_riesgo'], `scheduled_date`, `final_concept`, `report_pdf_url`, `created_at`, `updated_at`)
- `public.partner_academies` (`id`, `name`, `city`, `whatsapp_number`, `discount_text`, `referral_code`, `is_active`)
- Vista `public.v_candidates_with_course_status` (`user_id`, `full_name`, `phone_whatsapp`, `national_id`, `city`, `locality_neighborhood`, `primary_role`, `years_experience`, `has_military_booklet`, `has_own_motorcycle`, `motorcycle_cc`, `available_immediately`, `resume_pdf_url`, `course_name`, `completion_date`, `expiration_date`, `certificate_file_url`, `days_remaining`, `course_semaphore` ['SIN_CURSO'|'VIGENTE'|'PROXIMO_A_VENCER'|'VENCIDO'])
- Bucket público en Supabase Storage llamado: `documents`.

---

## 4. FUNCIONALIDADES CLAVE DEL MVP (ESPECIFICACIÓN FUNCIONAL)

### Módulo A: Experiencia del Guarda / Escolta (`/guarda/*`)
1. **Onboarding en 3 Pasos + Adjunto de Hoja de Vida (`/guarda/onboarding`):**
   - **Paso 1 (Datos y Rol):** Cédula, WhatsApp, Ciudad, Barrio/Localidad, Rol principal (botones tipo Chip grandes: Vigilante Fijo, Vigilante Móvil, Escolta VIP, Escolta Mercancía, Supervisor Motorizado, Operador Medios Tecnológicos, Manejador Canino), Años de experiencia, Switch de Libreta Militar y Switch de Moto propia (con cilindraje).
   - **Paso 2 (El Semáforo del Curso):** Fecha de su último curso de vigilancia. El sistema calcula en vivo cuántos días le quedan:
     - 🟢 `VIGENTE` (>30 días)
     - 🟡 `PRÓXIMO A VENCER` (1 a 30 días) -> Muestra botón de WhatsApp hacia Academia Aliada de su ciudad con código de descuento.
     - 🔴 `VENCIDO / SIN CURSO` (<=0 días) -> Muestra alerta y botón directo para renovar en Academia Aliada.
   - **Paso 3 (Adjuntar Hoja de Vida y Soportes - Estilo Computrabajo mejorado):**
     - Botón prominente para **Subir Hoja de Vida en PDF/Word** (`resume_pdf_url`) al bucket `documents`, formulario sencillo para agregar sus experiencias laborales y subir la foto de su Diploma del Curso y Cédula.
2. **Switch "Disponible para Relevo Hoy/Mañana":**
   - En la cabecera de `/guarda/vacantes`, un interruptor grande (`available_immediately`). Si está activo, el guarda aparece primero en el "Buscador de Relevos Urgentes" de las empresas.
3. **Feed de Vacantes con Calculadora de Match % y Postulación en 1 Clic:**
   - Muestra tarjetas con: Título, Empresa (con escudo dorado si `is_verified_company = true`), Salario real, Turno (`2x2x2`, `4x2`), Barrio y el **Match %**.
   - Sello en cada tarjeta: **"🛡️ Garantía Cero Cobros: Proceso 100% gratuito"**.

### Módulo B: Panel de la Empresa de Seguridad (`/empresa/*`)
1. **Dashboard y Créditos de Paquete B2B (`/empresa/dashboard`):**
   - Muestra un widget superior con su plan actual y un contador destacado: **"Créditos disponibles de Estudio de Seguridad + Visita Domiciliaria + Polígrafo: X"**, con un botón para comprar/recargar paquetes por WhatsApp.
2. **Publicador de Vacantes Táctico (`/empresa/vacantes/nueva`):**
   - Selectores rápidos de Turno (`2x2x2`, `4x2`, etc.), Salario, Requisitos excluyentes (Curso al día, Moto, Libreta) y dirección de citación a entrevista.
3. **ATS de Postulados + Citador WhatsApp + Botón de Polígrafo/Visita (`/empresa/vacantes/[id]`):**
   - Tabla de candidatos ordenada por `match_score` y estado del Semáforo del Curso (🟢/🟡/🔴).
   - **Botón "Ver Hoja de Vida PDF y Soportes":** Abre un modal lateral (Drawer) donde el reclutador ve el perfil estructurado Y puede visualizar/descargar la Hoja de Vida en PDF original del guarda y su diploma del curso.
   - **Botón "Citar por WhatsApp (1 Clic)":** Abre `https://wa.me/57[telefono]?text=...` con el mensaje autogenerado incluyendo nombre del guarda, vacante, turno y dirección de entrevista.
   - **Botón Estrella de Monetización ("🛡️ Solicitar Estudio + Visita + Polígrafo"):**
     - Al hacer clic en un candidato preseleccionado, descuenta 1 crédito de `companies.credits_security_studies`, cambia el estado del candidato a `en_estudio_seguridad` y crea un registro en `security_study_orders`.
     - Cuando el administrador sube el resultado, la empresa ve un badge **`✅ POLÍGRAFO Y VISITA APROBADOS`** y un botón para descargar el **Informe Confidencial en PDF**.
4. **Buscador de Relevos de Emergencia (`/empresa/relevos`):**
   - Directorio en vivo que filtra guardas con `available_immediately = true` y `course_semaphore = 'VIGENTE'` por Ciudad y Localidad.

### Módulo C: Panel SuperAdmin - Empresa de Poligrafía y Estudios (`/admin/*`)
1. **Bandeja de Órdenes de Estudio de Seguridad, Visita y Poligrafía (`/admin/estudios`):**
   - Lista todas las órdenes solicitadas por las empresas clientes.
   - Permite cambiar el estado (`solicitado` -> `agendado` -> `en_proceso` -> `aprobado` / `rechazado_riesgo`), escribir el concepto final y subir el PDF del estudio de seguridad/poligrafía al bucket `documents`.
2. **Gestión de Empresas y Carga de Paquetes (`/admin/empresas`):**
   - Switch para activar el sello `is_verified_company = true` y campo numérico para asignarle créditos de Estudios/Poligrafía cuando una empresa compra un paquete.

---

## 5. ESTRUCTURA DE CARPETAS (NEXT.JS APP ROUTER)
```text
src/
├── app/
│   ├── (public)/
│   │   ├── page.tsx                  # Landing page dual (Guardas vs Empresas + Oferta de Poligrafía)
│   │   ├── login/page.tsx            # Login/Registro unificado
│   │   └── precios-empresas/page.tsx # Paquetes de Vacantes + Estudio de Seguridad + Visita + Polígrafo
│   ├── guarda/
│   │   ├── layout.tsx                # Layout Mobile-First con Bottom Navigation Bar
│   │   ├── onboarding/page.tsx       # Wizard 3 pasos + Subida de Hoja de Vida PDF y Curso
│   │   ├── vacantes/page.tsx         # Feed con Switch de Relevo, Semáforo y Match %
│   │   ├── postulaciones/page.tsx    # Seguimiento de estados del guarda
│   │   └── perfil/page.tsx           # Edición de CV, experiencia y documentos
│   ├── empresa/
│   │   ├── layout.tsx                # Sidebar corporativo + Contador de Créditos de Poligrafía
│   │   ├── dashboard/page.tsx        # Resumen de vacantes y estudios en curso
│   │   ├── vacantes/nueva/page.tsx   # Formulario táctico de vacantes
│   │   ├── vacantes/[id]/page.tsx    # ATS: Lista de postulados, Visor de CV PDF, WhatsApp y Orden de Polígrafo
│   │   ├── relevos/page.tsx          # Buscador de disponibles para turno hoy
│   │   └── estudios/page.tsx         # Historial de informes de Poligrafía y Visitas Domiciliarias
│   └── admin/
│       ├── empresas/page.tsx         # Verificar empresas y recargar créditos de paquetes
│       ├── estudios/page.tsx         # Gestionar y subir informes de Polígrafo y Visita Domiciliaria
│       └── academias/page.tsx        # Gestionar academias aliadas
├── components/
│   ├── ui/                           # Botones, Chips, Modales, Semáforo Badge
│   ├── guarda/                       # CourseSemaphoreBanner, ReliefToggle, JobCard
│   └── empresa/                      # CandidateRow, ResumeDrawerModal, OrderSecurityStudyModal
└── lib/
    ├── supabase/                     # Clientes browser/server de Supabase
    └── utils/
        ├── matchCalculator.ts        # Lógica de % de compatibilidad guarda-vacante
        └── whatsappTemplates.ts      # Generador de links wa.me para citaciones y academias
```
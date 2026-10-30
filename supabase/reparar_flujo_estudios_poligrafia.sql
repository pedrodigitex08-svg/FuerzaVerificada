-- =============================================================================
-- FUERZA VERIFICADA: REPARACIÓN Y CONEXIÓN E2E DE ESTUDIOS DE SEGURIDAD & POLIGRAFÍA
-- =============================================================================
-- Instrucciones:
-- Copia y pega este script en el SQL Editor de tu panel de Supabase y haz clic en "Run".
-- Es 100% idempotente (puedes ejecutarlo varias veces sin riesgo ni pérdida de datos).
-- =============================================================================

-- 1. Agregar columna opcional study_type si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'security_study_orders'
      AND column_name = 'study_type'
  ) THEN
    ALTER TABLE public.security_study_orders
      ADD COLUMN study_type text DEFAULT 'combo_integral_poligrafo_visita';
  END IF;
END $$;

-- 2. Asegurar que el enum security_study_status incluya 'pendiente' y 'solicitado'
DO $$
BEGIN
  BEGIN
    ALTER TYPE public.security_study_status ADD VALUE IF NOT EXISTS 'pendiente';
  EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN OTHERS THEN NULL;
  END;
END $$;

-- 3. Habilitar Row Level Security (RLS) en security_study_orders
ALTER TABLE public.security_study_orders ENABLE ROW LEVEL SECURITY;

-- 4. Política 1: El SuperAdmin ('admin') puede ver, crear, actualizar y gestionar TODAS las órdenes
DROP POLICY IF EXISTS "SuperAdmin gestiona todos los estudios de seguridad" ON public.security_study_orders;
CREATE POLICY "SuperAdmin gestiona todos los estudios de seguridad"
  ON public.security_study_orders FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 5. Política 2: Las empresas pueden solicitar (INSERT) órdenes de estudio vinculadas a su empresa
DROP POLICY IF EXISTS "Empresas pueden solicitar estudios de seguridad" ON public.security_study_orders;
CREATE POLICY "Empresas pueden solicitar estudios de seguridad"
  ON public.security_study_orders FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Es el dueño de la empresa solicitante o es admin
    EXISTS (
      SELECT 1 FROM public.companies
      WHERE id = security_study_orders.company_id AND owner_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('company', 'admin')
    )
  );

-- 6. Política 3: Las empresas pueden consultar (SELECT) los estudios de su propia empresa
DROP POLICY IF EXISTS "Empresas pueden ver sus propios estudios de seguridad" ON public.security_study_orders;
CREATE POLICY "Empresas pueden ver sus propios estudios de seguridad"
  ON public.security_study_orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.companies
      WHERE id = security_study_orders.company_id AND owner_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 7. Política 4: Los candidatos pueden consultar (SELECT) estudios donde ellos sean el evaluado
DROP POLICY IF EXISTS "Candidatos pueden ver sus propios estudios" ON public.security_study_orders;
CREATE POLICY "Candidatos pueden ver sus propios estudios"
  ON public.security_study_orders FOR SELECT
  TO authenticated
  USING (
    candidate_id = auth.uid()
  );

-- 8. Otorgar permisos de ejecución DML al rol autenticado
GRANT SELECT, INSERT, UPDATE ON public.security_study_orders TO authenticated;

-- =============================================================================
-- VERIFICACIÓN FINAL: CONSULTAR ÓRDENES EXISTENTES
-- =============================================================================
SELECT COUNT(*) AS total_ordenes_seguridad FROM public.security_study_orders;

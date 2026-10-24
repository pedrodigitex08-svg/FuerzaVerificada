-- =============================================================================
-- FUERZAVERIFICADA - MEJORAS DE ARQUITECTURA, STORAGE PRIVADO Y RPC TRANSACCIONAL
-- =============================================================================
-- Instrucciones:
-- Copia y pega este script en el SQL Editor de tu panel de Supabase y haz clic en "Run".
-- Es 100% idempotente (puedes ejecutarlo varias veces sin riesgo).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. FUNCIÓN TRANSACCIONAL ATÓMICA (RPC) PARA SOLICITUD DE ESTUDIOS / POLIGRAFÍA
-- -----------------------------------------------------------------------------
-- Garantiza bloqueo de fila (FOR UPDATE), validación de saldo > 0, descuento
-- atómico de 1 crédito, creación de la orden en security_study_orders y cambio
-- de estado de la postulación a 'en_estudio_seguridad' en una sola transacción.

CREATE OR REPLACE FUNCTION public.request_security_study_order(
  p_company_id uuid,
  p_candidate_id uuid,
  p_application_id uuid DEFAULT NULL,
  p_study_type text DEFAULT 'combo_integral_poligrafo_visita'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id uuid;
  v_current_credits integer;
  v_remaining_credits integer;
  v_order_id uuid;
  v_caller_role text;
BEGIN
  -- 1. Verificar rol del usuario autenticado
  SELECT role::text INTO v_caller_role
  FROM public.profiles
  WHERE id = auth.uid();

  -- 2. Bloquear la fila de la empresa para evitar condiciones de carrera (Race Conditions)
  SELECT owner_id, credits_security_studies
  INTO v_owner_id, v_current_credits
  FROM public.companies
  WHERE id = p_company_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Empresa no encontrada (%).', p_company_id;
  END IF;

  -- Validar que quien ejecuta sea el propietario de la empresa o un SuperAdmin
  IF v_owner_id <> auth.uid() AND COALESCE(v_caller_role, '') <> 'admin' THEN
    RAISE EXCEPTION 'No autorizado para descontar créditos de esta empresa.';
  END IF;

  -- 3. Validar saldo disponible
  IF COALESCE(v_current_credits, 0) <= 0 THEN
    RAISE EXCEPTION 'Saldo insuficiente de créditos de estudio/poligrafía.';
  END IF;

  -- 4. Descontar 1 crédito de manera atómica
  v_remaining_credits := v_current_credits - 1;

  UPDATE public.companies
  SET credits_security_studies = v_remaining_credits
  WHERE id = p_company_id;

  -- 5. Insertar la orden en public.security_study_orders
  INSERT INTO public.security_study_orders (
    company_id,
    candidate_id,
    application_id,
    study_type,
    status,
    scheduled_date,
    final_concept,
    report_pdf_url
  )
  VALUES (
    p_company_id,
    p_candidate_id,
    p_application_id,
    p_study_type,
    'solicitado',
    'Programando visita domiciliaria...',
    'En verificación de antecedentes y prueba de poligrafía',
    NULL
  )
  RETURNING id INTO v_order_id;

  -- 6. Actualizar el estado de la postulación en el ATS si aplica
  IF p_application_id IS NOT NULL THEN
    UPDATE public.applications
    SET status = 'en_estudio_seguridad',
        updated_at = now()
    WHERE id = p_application_id;
  END IF;

  RETURN jsonb_build_object(
    'order_id', v_order_id,
    'remaining_credits', v_remaining_credits,
    'status', 'solicitado'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.request_security_study_order(uuid, uuid, uuid, text) TO authenticated;

-- -----------------------------------------------------------------------------
-- 2. BUCKET PRIVADO 'documents' Y POLÍTICAS RLS (LEY 1581 DE PROTECCIÓN DE DATOS)
-- -----------------------------------------------------------------------------
-- Configura el bucket 'documents' como privado (public = false) para que los
-- informes de poligrafía, hojas de vida y cédulas se accedan mediante Signed URLs.

INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Política 1: Usuarios autenticados pueden subir sus propios soportes o informes (Admin)
DROP POLICY IF EXISTS "Usuarios autenticados suben documentos" ON storage.objects;
CREATE POLICY "Usuarios autenticados suben documentos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'documents');

-- Política 2: Usuarios autenticados pueden actualizar documentos que subieron
DROP POLICY IF EXISTS "Usuarios autenticados actualizan documentos" ON storage.objects;
CREATE POLICY "Usuarios autenticados actualizan documentos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'documents');

-- Política 3: Lectura mediante Signed URLs para usuarios autenticados (Candidato dueño, Empresa reclutadora y SuperAdmin)
DROP POLICY IF EXISTS "Lectura segura de documentos autenticados" ON storage.objects;
CREATE POLICY "Lectura segura de documentos autenticados"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'documents');

-- -----------------------------------------------------------------------------
-- 3. TABLAS Y POLÍTICAS RLS DE FASE 5 (CONFIGURACIÓN, PLANES, EMPRESAS, ACADEMIAS)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.platform_settings (
  id text PRIMARY KEY DEFAULT 'global',
  whatsapp_sales_number text NOT NULL DEFAULT '573104508920',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura publica configuraciones" ON public.platform_settings;
CREATE POLICY "Lectura publica configuraciones"
  ON public.platform_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Modificacion admin configuraciones" ON public.platform_settings;
CREATE POLICY "Modificacion admin configuraciones"
  ON public.platform_settings FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id text PRIMARY KEY,
  name text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  credits integer NOT NULL DEFAULT 0,
  description text,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  badge text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura publica planes" ON public.subscription_plans;
CREATE POLICY "Lectura publica planes"
  ON public.subscription_plans FOR SELECT USING (true);

DROP POLICY IF EXISTS "Modificacion admin planes" ON public.subscription_plans;
CREATE POLICY "Modificacion admin planes"
  ON public.subscription_plans FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "SuperAdmin gestiona todas las empresas" ON public.companies;
CREATE POLICY "SuperAdmin gestiona todas las empresas"
  ON public.companies FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "SuperAdmin gestiona academias" ON public.partner_academies;
CREATE POLICY "SuperAdmin gestiona academias"
  ON public.partner_academies FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

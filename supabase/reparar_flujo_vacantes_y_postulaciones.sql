-- =============================================================================
-- FUERZA VERIFICADA: REPARACIÓN Y CONEXIÓN E2E DE VACANTES, ATS Y POSTULACIONES
-- =============================================================================
-- Instrucciones:
-- Copia y pega este script en el SQL Editor de tu panel de Supabase y haz clic en "Run".
-- Es 100% idempotente (puedes ejecutarlo varias veces sin riesgo ni pérdida de datos).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. ASEGURAR COLUMNAS EN PUBLIC.JOB_POSTS
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'job_posts'
      AND column_name = 'is_active'
  ) THEN
    ALTER TABLE public.job_posts ADD COLUMN is_active boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'job_posts'
      AND column_name = 'interview_address'
  ) THEN
    ALTER TABLE public.job_posts ADD COLUMN interview_address text;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 2. HABILITAR ROW LEVEL SECURITY (RLS) EN PUBLIC.JOB_POSTS
-- -----------------------------------------------------------------------------
ALTER TABLE public.job_posts ENABLE ROW LEVEL SECURITY;

-- Política 1: Lectura pública y de candidatos de vacantes activas (+ vacantes propias para la empresa)
DROP POLICY IF EXISTS "Lectura publica y candidatos vacantes activas" ON public.job_posts;
CREATE POLICY "Lectura publica y candidatos vacantes activas"
  ON public.job_posts FOR SELECT
  TO anon, authenticated
  USING (
    is_active = true
    OR
    EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id = job_posts.company_id AND c.owner_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Política 2: Empresas y SuperAdmin pueden publicar vacantes (INSERT)
DROP POLICY IF EXISTS "Empresas pueden publicar vacantes" ON public.job_posts;
CREATE POLICY "Empresas pueden publicar vacantes"
  ON public.job_posts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id = job_posts.company_id AND c.owner_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('company', 'admin')
    )
  );

-- Política 3: Empresas y SuperAdmin pueden actualizar sus vacantes (UPDATE)
DROP POLICY IF EXISTS "Empresas pueden actualizar sus vacantes" ON public.job_posts;
CREATE POLICY "Empresas pueden actualizar sus vacantes"
  ON public.job_posts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id = job_posts.company_id AND c.owner_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Política 4: Empresas y SuperAdmin pueden eliminar sus vacantes (DELETE)
DROP POLICY IF EXISTS "Empresas pueden eliminar sus vacantes" ON public.job_posts;
CREATE POLICY "Empresas pueden eliminar sus vacantes"
  ON public.job_posts FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id = job_posts.company_id AND c.owner_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_posts TO anon, authenticated;

-- -----------------------------------------------------------------------------
-- 3. HABILITAR ROW LEVEL SECURITY (RLS) EN PUBLIC.APPLICATIONS
-- -----------------------------------------------------------------------------
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Política 1: Candidatos y SuperAdmin pueden enviar su postulación (INSERT)
DROP POLICY IF EXISTS "Candidatos pueden postularse a vacantes" ON public.applications;
CREATE POLICY "Candidatos pueden postularse a vacantes"
  ON public.applications FOR INSERT
  TO authenticated
  WITH CHECK (
    candidate_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Política 2: Candidatos ven sus propias postulaciones, Empresas ven postulantes a sus vacantes, y SuperAdmin ve todo (SELECT)
DROP POLICY IF EXISTS "Lectura de postulaciones autorizadas" ON public.applications;
CREATE POLICY "Lectura de postulaciones autorizadas"
  ON public.applications FOR SELECT
  TO authenticated
  USING (
    candidate_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM public.job_posts jp
      JOIN public.companies c ON c.id = jp.company_id
      WHERE jp.id = applications.job_id AND c.owner_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Política 3: Empresas actualizan el estado de sus postulantes en el ATS (UPDATE)
DROP POLICY IF EXISTS "Empresas gestionan estado en ATS" ON public.applications;
CREATE POLICY "Empresas gestionan estado en ATS"
  ON public.applications FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.job_posts jp
      JOIN public.companies c ON c.id = jp.company_id
      WHERE jp.id = applications.job_id AND c.owner_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

GRANT SELECT, INSERT, UPDATE ON public.applications TO anon, authenticated;

-- -----------------------------------------------------------------------------
-- 4. POLÍTICAS RLS EN PUBLIC.COMPANIES
-- -----------------------------------------------------------------------------
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura publica empresas" ON public.companies;
CREATE POLICY "Lectura publica empresas"
  ON public.companies FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Empresas gestionan su propio registro" ON public.companies;
CREATE POLICY "Empresas gestionan su propio registro"
  ON public.companies FOR ALL
  TO authenticated
  USING (
    owner_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  )
  WITH CHECK (
    owner_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

GRANT SELECT, INSERT, UPDATE ON public.companies TO anon, authenticated;

-- -----------------------------------------------------------------------------
-- VERIFICACIÓN FINAL: CONTAR REGISTROS DE PRUEBA
-- -----------------------------------------------------------------------------
SELECT
  (SELECT COUNT(*) FROM public.companies) AS total_empresas,
  (SELECT COUNT(*) FROM public.job_posts) AS total_vacantes,
  (SELECT COUNT(*) FROM public.applications) AS total_postulaciones;

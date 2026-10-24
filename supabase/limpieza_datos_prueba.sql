-- ==============================================================================
-- FUERZA VERIFICADA: SCRIPT DE LIMPIEZA DE DATOS DE PRUEBA (MODO PRODUCCIÓN)
-- ==============================================================================
-- Este script elimina de forma segura todos los registros simulados/demo de las
-- tablas operativas (postulaciones, órdenes de estudio, vacantes, candidatos y
-- empresas demo), PRESERVANDO ESTRICTAMENTE:
--   1. Los usuarios con rol 'admin' (SuperAdministrador) en public.profiles y auth.users.
--   2. La configuración comercial global en public.platform_settings.
--   3. Los paquetes comerciales de suscripción en public.subscription_plans.
-- ==============================================================================

BEGIN;

-- 1. Vaciar postulaciones operativas
DELETE FROM public.applications;

-- 2. Vaciar órdenes de estudios de seguridad y poligrafía
DELETE FROM public.security_study_orders;

-- 3. Vaciar documentos y diplomas cargados por aspirantes de prueba
DELETE FROM public.candidate_documents;
DELETE FROM public.candidate_courses;

-- 4. Vaciar perfiles operativos de aspirantes que no correspondan al SuperAdmin
DELETE FROM public.candidate_profiles
WHERE user_id NOT IN (
    SELECT id FROM public.profiles WHERE role = 'admin'
);

-- 5. Vaciar ofertas y vacantes de empleo publicadas durante pruebas
DELETE FROM public.jobs;

-- 6. Vaciar empresas demo (conservando solo si alguna fue creada por el SuperAdmin)
DELETE FROM public.companies
WHERE owner_id NOT IN (
    SELECT id FROM public.profiles WHERE role = 'admin'
);

-- 7. Vaciar perfiles demo de aspirantes y empresas en public.profiles
--    (CONSERVANDO INTACTO AL ADMINISTRADOR)
DELETE FROM public.profiles
WHERE role != 'admin';

-- 8. Opcional: Eliminar usuarios huérfanos en auth.users que no sean administradores
-- (Solo aplicable si se ejecuta con permisos de superusuario / service_role de Supabase)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        DELETE FROM auth.users
        WHERE id NOT IN (
            SELECT id FROM public.profiles WHERE role = 'admin'
        );
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'auth.users no modificada por restricciones de permisos.';
END $$;

COMMIT;

-- ==============================================================================
-- VALIDACIÓN FINAL: VERIFICAR QUE PLATAFORMA QUEDÓ EN BLANCO Y CONFIGURACIÓN ACTIVA
-- ==============================================================================
SELECT 'Admin Profiles' AS entidad, COUNT(*) AS total FROM public.profiles WHERE role = 'admin'
UNION ALL
SELECT 'Postulaciones', COUNT(*) FROM public.applications
UNION ALL
SELECT 'Vacantes', COUNT(*) FROM public.jobs
UNION ALL
SELECT 'Estudios Seguridad', COUNT(*) FROM public.security_study_orders
UNION ALL
SELECT 'Configuración Comercial', COUNT(*) FROM public.platform_settings
UNION ALL
SELECT 'Planes de Suscripción', COUNT(*) FROM public.subscription_plans;

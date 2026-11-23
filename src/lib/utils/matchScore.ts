import { normalizeSecurityRole } from "@/lib/utils/roleNormalizer";
import {
  EDUCATION_LEVELS,
  findDepartmentByCity,
} from "@/lib/constants/colombiaSecurityCatalog";

export interface MatchScoreBreakdown {
  roleMatch: number; // 0 - 30
  locationMatch: number; // 0 - 20
  simetricMatch: number; // 0 - 20
  experienceMatch: number; // 0 - 15
  educationVehicleMatch: number; // 0 - 15
}

export interface CandidateMatchResult {
  score: number; // 0 - 100
  breakdown: MatchScoreBreakdown;
}

export interface MatchJobInput {
  role_required?: string | null;
  city?: string | null;
  department?: string | null;
  min_experience_years?: number | null;
  min_education_level?: string | null;
  requires_active_course?: boolean | null;
  requires_motorcycle?: boolean | null;
  requires_license?: boolean | null;
  license_class_required?: string | null;
}

export interface MatchCandidateInput {
  primary_role?: string | null;
  selected_roles?: string[] | null;
  city?: string | null;
  department?: string | null;
  years_experience?: number | null;
  work_experiences?: Array<{
    startDate?: string | null;
    endDate?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    current?: boolean | null;
    currently_working?: boolean | null;
  }> | null;
  has_simetric_course?: boolean | null;
  security_courses?: unknown[] | null;
  course_semaphore?: string | null;
  education_level?: string | null;
  has_own_vehicle?: boolean | null;
  has_own_motorcycle?: boolean | null;
  vehicle_type?: string | null;
  driver_license_class?: string | null;
  has_driving_license?: boolean | null;
  license_category?: string | null;
}

function normalizeText(value?: string | null): string {
  if (!value || typeof value !== "string") return "";
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

const NON_OPERATIONAL_ROLES = new Set([
  "personal administrativo",
  "conserje",
]);

function getEducationRank(level?: string | null): number {
  const norm = normalizeText(level);
  if (!norm) return -1;

  for (let i = 0; i < EDUCATION_LEVELS.length; i++) {
    const refNorm = normalizeText(EDUCATION_LEVELS[i]);
    if (norm === refNorm || norm.includes(refNorm) || refNorm.includes(norm)) {
      return i;
    }
  }

  // Fallback por palabras clave comunes
  if (norm.includes("doctorado")) return 8;
  if (norm.includes("maestria")) return 7;
  if (norm.includes("especializacion") || norm.includes("postgrado")) return 6;
  if (norm.includes("profesional") || norm.includes("universitario")) return 5;
  if (norm.includes("tecnolog")) return 4;
  if (norm.includes("tecnic")) return 3;
  if (norm.includes("bachiller") || norm.includes("media")) return 2;
  if (norm.includes("secundaria")) return 1;
  if (norm.includes("primaria")) return 0;

  return -1;
}

function computeExperienceFromWorkHistory(
  experiences?: MatchCandidateInput["work_experiences"]
): number {
  if (!Array.isArray(experiences) || experiences.length === 0) return 0;

  let totalMonths = 0;
  const now = new Date();

  for (const exp of experiences) {
    if (!exp || typeof exp !== "object") continue;
    const rawStart = exp.startDate || exp.start_date;
    if (!rawStart) continue;

    const startDate = new Date(rawStart);
    if (Number.isNaN(startDate.getTime())) continue;

    const isCurrent = Boolean(exp.current || exp.currently_working);
    const rawEnd = exp.endDate || exp.end_date;
    const endDate = isCurrent || !rawEnd ? now : new Date(rawEnd);
    if (Number.isNaN(endDate.getTime())) continue;

    const diffMonths =
      (endDate.getFullYear() - startDate.getFullYear()) * 12 +
      (endDate.getMonth() - startDate.getMonth());
    if (diffMonths > 0) {
      totalMonths += diffMonths;
    }
  }

  return Math.round((totalMonths / 12) * 10) / 10;
}

function safeNumber(val: unknown, fallback = 0): number {
  const n = Number(val);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Motor puro de cálculo de % de Adecuación (0 a 100) para vacantes de seguridad privada.
 *
 * Ponderación:
 * - Perfil / Especialidad: 30 pts
 * - Ubicación (ciudad 20 / departamento 10): 20 pts
 * - Curso SIMETRIC / Acreditación: 20 pts
 * - Años de experiencia: 15 pts
 * - Estudios mínimos + Vehículo/Licencia: 15 pts
 */
export function calculateCandidateMatchScore(
  job?: MatchJobInput | null,
  candidate?: MatchCandidateInput | null
): CandidateMatchResult {
  const safeJob = job || {};
  const safeCand = candidate || {};

  // -------------------------------------------------------------------------
  // 1. PERFIL / ESPECIALIDAD (30 pts)
  // -------------------------------------------------------------------------
  let roleMatch = 0;
  const jobRoleRaw = safeJob.role_required;
  if (!jobRoleRaw || !String(jobRoleRaw).trim()) {
    roleMatch = 30;
  } else {
    const normalizedJobRole = normalizeText(normalizeSecurityRole(jobRoleRaw));
    const candRoles = new Set<string>();

    if (safeCand.primary_role) {
      candRoles.add(normalizeText(normalizeSecurityRole(safeCand.primary_role)));
    }
    if (Array.isArray(safeCand.selected_roles)) {
      for (const r of safeCand.selected_roles) {
        if (typeof r === "string" && r.trim()) {
          candRoles.add(normalizeText(normalizeSecurityRole(r)));
        }
      }
    }

    if (candRoles.has(normalizedJobRole)) {
      roleMatch = 30;
    }
  }

  // -------------------------------------------------------------------------
  // 2. UBICACIÓN (20 pts ciudad / 10 pts departamento)
  // -------------------------------------------------------------------------
  let locationMatch = 0;
  const jobCity = normalizeText(safeJob.city);
  const candCity = normalizeText(safeCand.city);
  const jobDept = normalizeText(
    safeJob.department || (safeJob.city ? findDepartmentByCity(safeJob.city) : "")
  );
  const candDept = normalizeText(
    safeCand.department ||
      (safeCand.city ? findDepartmentByCity(safeCand.city) : "")
  );

  if (!jobCity && !jobDept) {
    locationMatch = 20;
  } else if (
    jobCity &&
    candCity &&
    (jobCity === candCity ||
      jobCity.includes(candCity) ||
      candCity.includes(jobCity))
  ) {
    locationMatch = 20;
  } else if (
    jobDept &&
    candDept &&
    (jobDept === candDept ||
      jobDept.includes(candDept) ||
      candDept.includes(jobDept))
  ) {
    locationMatch = 10;
  }

  // -------------------------------------------------------------------------
  // 3. CURSO SIMETRIC / ACREDITACIÓN (20 pts)
  // -------------------------------------------------------------------------
  let simetricMatch = 0;
  const normalizedRoleForCourse = normalizeText(
    normalizeSecurityRole(safeJob.role_required || "")
  );
  const isNonOperational = NON_OPERATIONAL_ROLES.has(normalizedRoleForCourse);

  if (isNonOperational) {
    simetricMatch = 20;
  } else {
    const hasSecurityCoursesArray =
      Array.isArray(safeCand.security_courses) &&
      safeCand.security_courses.length > 0;
    const hasValidLegacyCourse =
      safeCand.course_semaphore === "VIGENTE" ||
      safeCand.course_semaphore === "PROXIMO_A_VENCER";

    if (
      safeCand.has_simetric_course === true ||
      hasSecurityCoursesArray ||
      hasValidLegacyCourse
    ) {
      simetricMatch = 20;
    }
  }

  // -------------------------------------------------------------------------
  // 4. AÑOS DE EXPERIENCIA (15 pts)
  // -------------------------------------------------------------------------
  let experienceMatch = 0;
  const requiredYears = Math.max(0, safeNumber(safeJob.min_experience_years, 0));
  const directYears = Math.max(0, safeNumber(safeCand.years_experience, 0));
  const computedYears = computeExperienceFromWorkHistory(
    safeCand.work_experiences
  );
  const candidateYears = Math.max(directYears, computedYears);

  if (requiredYears <= 0) {
    experienceMatch = 15;
  } else if (candidateYears >= requiredYears) {
    experienceMatch = 15;
  } else if (candidateYears > 0) {
    experienceMatch = Math.max(
      0,
      Math.min(15, Math.round((candidateYears / requiredYears) * 15))
    );
  }

  // -------------------------------------------------------------------------
  // 5. ESTUDIOS MÍNIMOS + VEHÍCULO / LICENCIA (15 pts)
  // -------------------------------------------------------------------------
  const reqEduRank = getEducationRank(safeJob.min_education_level);
  const candEduRank = getEducationRank(safeCand.education_level);

  const needsVehicle = Boolean(safeJob.requires_motorcycle);
  const needsLicense = Boolean(
    safeJob.requires_license || safeJob.license_class_required
  );
  const needsLogistics = needsVehicle || needsLicense;

  const hasVehicle = Boolean(
    safeCand.has_own_vehicle ||
      safeCand.has_own_motorcycle ||
      (safeCand.vehicle_type && normalizeText(safeCand.vehicle_type) !== "ninguno")
  );

  const candLicenseClass = normalizeText(
    safeCand.driver_license_class || safeCand.license_category
  );
  const reqLicenseClass = normalizeText(safeJob.license_class_required);
  const hasAnyLicense = Boolean(
    candLicenseClass || safeCand.has_driving_license
  );
  const licenseMatches = reqLicenseClass
    ? candLicenseClass.includes(reqLicenseClass) ||
      (hasAnyLicense && !candLicenseClass)
    : hasAnyLicense;

  let educationVehicleMatch = 0;

  if (!needsLogistics) {
    // Todos los 15 pts ponderan estudios mínimos
    if (reqEduRank === -1) {
      educationVehicleMatch = 15;
    } else if (candEduRank >= reqEduRank) {
      educationVehicleMatch = 15;
    } else if (candEduRank >= 0 && candEduRank === reqEduRank - 1) {
      educationVehicleMatch = 8;
    } else {
      educationVehicleMatch = 0;
    }
  } else {
    // 8 pts estudios + 7 pts vehículo/licencia
    let eduPts = 0;
    if (reqEduRank === -1 || candEduRank >= reqEduRank) {
      eduPts = 8;
    } else if (candEduRank >= 0 && candEduRank === reqEduRank - 1) {
      eduPts = 4;
    }

    let logPts = 0;
    if (needsVehicle && needsLicense) {
      if (hasVehicle && licenseMatches) logPts = 7;
      else if (hasVehicle || licenseMatches) logPts = 4;
    } else if (needsVehicle) {
      logPts = hasVehicle ? 7 : 0;
    } else if (needsLicense) {
      logPts = licenseMatches ? 7 : hasAnyLicense ? 3 : 0;
    }

    educationVehicleMatch = eduPts + logPts;
  }

  const rawTotal =
    roleMatch +
    locationMatch +
    simetricMatch +
    experienceMatch +
    educationVehicleMatch;

  const score = Number.isFinite(rawTotal)
    ? Math.max(0, Math.min(100, Math.round(rawTotal)))
    : 0;

  return {
    score,
    breakdown: {
      roleMatch,
      locationMatch,
      simetricMatch,
      experienceMatch,
      educationVehicleMatch,
    },
  };
}

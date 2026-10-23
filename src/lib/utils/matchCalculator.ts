import {
  CandidateProfile,
  CandidateWithCourseStatusView,
  JobPost,
  CourseSemaphore,
} from "@/types/database";

export interface MatchResult {
  score: number; // 0 to 100
  passedStrictRequirements: boolean;
  breakdown: {
    roleMatch: boolean;
    cityMatch: boolean;
    courseValid: boolean;
    courseStatus: CourseSemaphore;
    motorcycleOk: boolean;
    militaryBookletOk: boolean;
    experienceOk: boolean;
  };
  reasons: string[];
}

export interface CandidateMatchInput {
  city: string;
  primary_role: string;
  years_experience: number;
  has_military_booklet: boolean;
  has_own_motorcycle: boolean;
  motorcycle_cc?: number | null;
  available_immediately?: boolean;
  course_semaphore?: CourseSemaphore;
}

/**
 * Calculates compatibility percentage between a security job post and a candidate.
 */
export function calculateMatchScore(
  job: JobPost,
  candidate: CandidateProfile | CandidateWithCourseStatusView | CandidateMatchInput,
  courseStatusOverride?: CourseSemaphore
): MatchResult {
  let score = 0;
  const reasons: string[] = [];
  let passedStrictRequirements = true;

  // 1. Role Match (Weight: 30%)
  const jobRole = (job.role_required || "").toLowerCase().trim();
  const candRole = (candidate.primary_role || "").toLowerCase().trim();

  const roleMatch =
    jobRole === candRole ||
    (jobRole.includes("vigilante") && candRole.includes("vigilante")) ||
    (jobRole.includes("escolta") && candRole.includes("escolta"));

  if (roleMatch) {
    score += 30;
    reasons.push("Cumple con el cargo requerido (+30%)");
  } else {
    reasons.push("El cargo principal no coincide exactamente");
    if (job.is_strict_filter) passedStrictRequirements = false;
  }

  // 2. City Match (Weight: 20%)
  const jobCity = (job.city || "").toLowerCase().trim();
  const candCity = (candidate.city || "").toLowerCase().trim();
  const cityMatch = jobCity === candCity || !jobCity;

  if (cityMatch) {
    score += 20;
    reasons.push("Ubicado en la misma ciudad (+20%)");
  } else {
    reasons.push("Ciudad diferente a la sede de la vacante");
    if (job.is_strict_filter) passedStrictRequirements = false;
  }

  // 3. Course Status (Weight: 25%)
  const courseStatus: CourseSemaphore =
    courseStatusOverride ||
    ("course_semaphore" in candidate && candidate.course_semaphore
      ? candidate.course_semaphore
      : "SIN_CURSO");

  const courseValid =
    courseStatus === "VIGENTE" || courseStatus === "PROXIMO_A_VENCER";

  if (job.requires_active_course) {
    if (courseStatus === "VIGENTE") {
      score += 25;
      reasons.push("Curso de vigilancia vigente (+25%)");
    } else if (courseStatus === "PROXIMO_A_VENCER") {
      score += 15;
      reasons.push("Curso próximo a vencer (+15%)");
    } else {
      reasons.push("Curso de vigilancia vencido o no registrado");
      if (job.is_strict_filter) passedStrictRequirements = false;
    }
  } else {
    // If not strictly required by job, give points if valid
    if (courseValid) {
      score += 25;
      reasons.push("Curso de seguridad al día (+25%)");
    } else {
      score += 10;
    }
  }

  // 4. Motorcycle requirement (Weight: 15%)
  let motorcycleOk = true;
  if (job.requires_motorcycle) {
    if (!candidate.has_own_motorcycle) {
      motorcycleOk = false;
      reasons.push("Requiere moto propia y el candidato no cuenta con vehículo");
      if (job.is_strict_filter) passedStrictRequirements = false;
    } else if (
      job.min_motorcycle_cc &&
      (candidate.motorcycle_cc || 0) < job.min_motorcycle_cc
    ) {
      motorcycleOk = false;
      reasons.push(
        `Cilindraje de moto insuficiente (Requiere mín. ${job.min_motorcycle_cc}cc)`
      );
      if (job.is_strict_filter) passedStrictRequirements = false;
    } else {
      score += 15;
      reasons.push("Cuenta con moto propia requerida (+15%)");
    }
  } else {
    score += 15;
  }

  // 5. Military booklet (Weight: 5%)
  let militaryBookletOk = true;
  if (job.requires_military_booklet) {
    if (candidate.has_military_booklet) {
      score += 5;
      reasons.push("Cuenta con libreta militar (+5%)");
    } else {
      militaryBookletOk = false;
      reasons.push("Requiere libreta militar");
      if (job.is_strict_filter) passedStrictRequirements = false;
    }
  } else {
    score += 5;
  }

  // 6. Experience requirement (Weight: 5%)
  const candExp = candidate.years_experience || 0;
  const minExp = job.min_experience_years || 0;
  let experienceOk = candExp >= minExp;

  if (experienceOk) {
    score += 5;
    reasons.push(`Experiencia suficiente (${candExp} años vs ${minExp} req.) (+5%)`);
  } else {
    reasons.push(`Experiencia menor a la solicitada (${candExp} vs ${minExp} años)`);
    if (job.is_strict_filter) passedStrictRequirements = false;
  }

  // Bonus: Urgent Relief Availability (+5% boost cap at 100)
  if (job.is_urgent_relief && candidate.available_immediately) {
    score = Math.min(100, score + 5);
    reasons.push("Disponible de inmediato para relevo urgente (+5% extra)");
  }

  // Cap score between 0 and 100
  const finalScore = Math.max(0, Math.min(100, Math.round(score)));

  return {
    score: finalScore,
    passedStrictRequirements,
    breakdown: {
      roleMatch,
      cityMatch,
      courseValid,
      courseStatus,
      motorcycleOk,
      militaryBookletOk,
      experienceOk,
    },
    reasons,
  };
}

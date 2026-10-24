import { Company, PartnerAcademy, SecurityStudyStatus } from "@/types/database";

export interface DemoSecurityOrder {
  id: string;
  candidate_name: string;
  national_id: string;
  candidate_phone: string;
  candidate_address: string;
  company_name: string;
  company_phone: string;
  job_title: string;
  status: SecurityStudyStatus;
  scheduled_date: string;
  final_concept: string;
  report_pdf_url: string | null;
  include_polygraph: boolean;
  include_home_visit: boolean;
  include_background_study: boolean;
  resume_pdf_url: string | null;
  course_diploma_url: string | null;
  created_at: string;
}

// Clean initial data for real production usage (no hardcoded demo records)
export const INITIAL_DEMO_COMPANIES: Company[] = [];

export const INITIAL_DEMO_ACADEMIES: PartnerAcademy[] = [];

export const INITIAL_DEMO_ORDERS: DemoSecurityOrder[] = [];

/**
 * Returns empty arrays (clean slate - no mock data)
 */
export function initializeSeedData(): {
  companies: Company[];
  orders: DemoSecurityOrder[];
  academies: PartnerAcademy[];
} {
  return {
    companies: [],
    orders: [],
    academies: [],
  };
}

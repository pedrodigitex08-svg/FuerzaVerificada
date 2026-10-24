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
 * Initializes or resets data collections in localStorage (clean slate)
 */
export function initializeSeedData(forceReset: boolean = false): {
  companies: Company[];
  orders: DemoSecurityOrder[];
  academies: PartnerAcademy[];
} {
  if (typeof window === "undefined") {
    return {
      companies: [],
      orders: [],
      academies: [],
    };
  }

  // Check or set companies
  const savedCompanies = localStorage.getItem("fv_companies");
  let companies: Company[] = [];
  if (forceReset) {
    localStorage.setItem("fv_companies", JSON.stringify([]));
  } else if (savedCompanies) {
    try {
      companies = JSON.parse(savedCompanies);
    } catch {
      companies = [];
    }
  }

  // Check or set security orders
  const savedOrders = localStorage.getItem("fv_security_orders");
  let orders: DemoSecurityOrder[] = [];
  if (forceReset) {
    localStorage.setItem("fv_security_orders", JSON.stringify([]));
  } else if (savedOrders) {
    try {
      orders = JSON.parse(savedOrders);
    } catch {
      orders = [];
    }
  }

  // Check or set academies
  const savedAcademies = localStorage.getItem("fv_partner_academies");
  let academies: PartnerAcademy[] = [];
  if (forceReset) {
    localStorage.setItem("fv_partner_academies", JSON.stringify([]));
  } else if (savedAcademies) {
    try {
      academies = JSON.parse(savedAcademies);
    } catch {
      academies = [];
    }
  }

  return {
    companies,
    orders,
    academies,
  };
}

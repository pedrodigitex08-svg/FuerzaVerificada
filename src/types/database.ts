export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "candidate" | "company" | "admin";

export type ApplicationStatus =
  | "postulado"
  | "preseleccionado"
  | "citado_entrevista"
  | "en_estudio_seguridad"
  | "contratado"
  | "descartado";

export type SecurityStudyStatus =
  | "solicitado"
  | "agendado"
  | "en_proceso"
  | "aprobado"
  | "rechazado_riesgo";

export type CourseSemaphore =
  | "SIN_CURSO"
  | "VIGENTE"
  | "PROXIMO_A_VENCER"
  | "VENCIDO";

export type SecurityRoleType =
  | "Vigilante Fijo"
  | "Vigilante Móvil"
  | "Escolta VIP"
  | "Escolta Mercancía"
  | "Supervisor Motorizado"
  | "Operador Medios Tecnológicos"
  | "Manejador Canino"
  | "Inspector de Seguridad"
  | string;

export interface WorkExperienceItem {
  id?: string;
  company: string;
  role: string;
  startDate: string;
  endDate?: string;
  current?: boolean;
  description?: string;
}

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  phone_whatsapp: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface CandidateProfile {
  user_id: string;
  national_id: string;
  city: string;
  locality_neighborhood: string | null;
  address: string | null;
  birth_date: string | null;
  primary_role: SecurityRoleType;
  years_experience: number;
  has_military_booklet: boolean;
  has_own_motorcycle: boolean;
  motorcycle_cc: number | null;
  has_driving_license: boolean;
  license_category: string | null;
  has_weapon_permit_experience: boolean;
  available_immediately: boolean;
  bio_summary: string | null;
  work_experience_json: Json | null;
  resume_pdf_url: string | null;
  updated_at: string;
}

export interface CandidateCourse {
  id: string;
  candidate_id: string;
  course_name: string;
  academy_name: string;
  nro_credencial_supervigilancia: string | null;
  completion_date: string;
  expiration_date: string;
  certificate_file_url: string | null;
  is_verified_by_admin: boolean;
  created_at: string;
}

export interface CandidateDocument {
  id: string;
  candidate_id: string;
  doc_type: string;
  file_url: string;
  uploaded_at: string;
}

export interface Company {
  id: string;
  owner_id: string;
  company_name: string;
  nit: string;
  supervigilancia_license: string | null;
  city: string;
  address: string | null;
  contact_person: string;
  contact_phone: string;
  logo_url: string | null;
  is_verified_company: boolean;
  plan_name: string;
  credits_security_studies: number;
  created_at: string;
}

export interface JobPost {
  id: string;
  company_id: string;
  title: string;
  role_required: SecurityRoleType;
  city: string;
  zone_neighborhood: string | null;
  shift: string;
  salary_monthly: number;
  includes_surcharges: boolean;
  requires_active_course: boolean;
  requires_motorcycle: boolean;
  min_motorcycle_cc: number | null;
  requires_military_booklet: boolean;
  min_experience_years: number;
  is_strict_filter: boolean;
  is_urgent_relief: boolean;
  description: string;
  interview_address: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Application {
  id: string;
  job_id: string;
  candidate_id: string;
  match_score: number;
  status: ApplicationStatus;
  recruiter_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SecurityStudyOrder {
  id: string;
  company_id: string;
  candidate_id: string;
  application_id: string | null;
  include_polygraph: boolean;
  include_home_visit: boolean;
  include_background_study: boolean;
  status: SecurityStudyStatus;
  scheduled_date: string | null;
  final_concept: string | null;
  report_pdf_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminSecurityStudyOrderItem {
  id: string;
  candidate_id?: string;
  candidate_name: string;
  national_id: string;
  candidate_phone: string;
  candidate_address: string;
  company_id?: string;
  company_name: string;
  company_phone: string;
  job_title: string;
  study_type?: string;
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

export type DemoSecurityOrder = AdminSecurityStudyOrderItem;

export interface PartnerAcademy {
  id: string;
  name: string;
  city: string;
  whatsapp_number: string;
  discount_text: string;
  referral_code: string;
  is_active: boolean;
}

export interface PlatformSetting {
  id: string;
  whatsapp_sales_number: string;
  updated_at?: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  credits: number;
  description?: string;
  features: string[] | string;
  badge?: string | null;
  is_active: boolean;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CandidateWithCourseStatusView {
  user_id: string;
  full_name: string;
  phone_whatsapp: string;
  national_id: string;
  city: string;
  locality_neighborhood: string | null;
  primary_role: SecurityRoleType;
  years_experience: number;
  has_military_booklet: boolean;
  has_own_motorcycle: boolean;
  motorcycle_cc: number | null;
  available_immediately: boolean;
  resume_pdf_url: string | null;
  course_name: string | null;
  completion_date: string | null;
  expiration_date: string | null;
  certificate_file_url: string | null;
  days_remaining: number | null;
  course_semaphore: CourseSemaphore;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string; role: UserRole; full_name: string; phone_whatsapp: string; email: string };
        Update: Partial<Profile>;
      };
      candidate_profiles: {
        Row: CandidateProfile;
        Insert: Partial<CandidateProfile> & { user_id: string; national_id: string; city: string; primary_role: SecurityRoleType };
        Update: Partial<CandidateProfile>;
      };
      candidate_courses: {
        Row: CandidateCourse;
        Insert: Partial<CandidateCourse> & { candidate_id: string; course_name: string; academy_name: string; completion_date: string; expiration_date: string };
        Update: Partial<CandidateCourse>;
      };
      candidate_documents: {
        Row: CandidateDocument;
        Insert: Partial<CandidateDocument> & { candidate_id: string; doc_type: string; file_url: string };
        Update: Partial<CandidateDocument>;
      };
      companies: {
        Row: Company;
        Insert: Partial<Company> & { owner_id: string; company_name: string; nit: string; contact_person: string; contact_phone: string; city: string };
        Update: Partial<Company>;
      };
      job_posts: {
        Row: JobPost;
        Insert: Partial<JobPost> & { company_id: string; title: string; role_required: SecurityRoleType; city: string; shift: string; salary_monthly: number; description: string };
        Update: Partial<JobPost>;
      };
      applications: {
        Row: Application;
        Insert: Partial<Application> & { job_id: string; candidate_id: string };
        Update: Partial<Application>;
      };
      security_study_orders: {
        Row: SecurityStudyOrder;
        Insert: Partial<SecurityStudyOrder> & { company_id: string; candidate_id: string };
        Update: Partial<SecurityStudyOrder>;
      };
      partner_academies: {
        Row: PartnerAcademy;
        Insert: Partial<PartnerAcademy> & { name: string; city: string; whatsapp_number: string; discount_text: string; referral_code: string };
        Update: Partial<PartnerAcademy>;
      };
      platform_settings: {
        Row: PlatformSetting;
        Insert: Partial<PlatformSetting> & { whatsapp_sales_number: string };
        Update: Partial<PlatformSetting>;
      };
      subscription_plans: {
        Row: SubscriptionPlan;
        Insert: Partial<SubscriptionPlan> & { name: string; price: number; credits: number };
        Update: Partial<SubscriptionPlan>;
      };
    };
    Views: {
      v_candidates_with_course_status: {
        Row: CandidateWithCourseStatusView;
      };
    };
  };
}

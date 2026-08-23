/* ── Types for Scheme Navigator ─────────────────────────────────────────── */

export interface CitizenCreate {
  age: number;
  gender: "male" | "female";
  caste: "sc" | "st" | "obc" | "bc" | "ebc" | "general" | "minority";
  annual_income?: number | null;
  annual_turnover?: number | null;
  units_usage?: number | null;
  business_type?: string | null;
  has_bank_account: boolean;
  has_gst: boolean;
  has_white_ration_card: boolean;
  owns_land: boolean;
}

export interface CitizenResponse {
  id: string;
  age: number;
  gender: string;
  caste: string;
  annual_income?: number | null;
  annual_turnover?: number | null;
  units_usage?: number | null;
  business_type?: string | null;
  satisfied_flags: string[];
}

export interface SchemeResponse {
  id: string;
  name: string;
  telugu_name?: string | null;
  description?: string | null;
  telugu_description?: string | null;
  benefit_type?: string | null;
  amount_min?: number | null;
  amount_max?: number | null;
  interest_rate?: string | null;
  unit?: string | null;
  apply_url?: string | null;
  apply_offline?: string | null;
  helpline?: string | null;
  processing_time_days?: number | null;
  success_rate?: string | null;
  success_rank?: number | null;
  documents: string[];
  tags: string[];
  business_types: string[];
  individual_types: string[];
  required_flags: string[];
}

export interface SchemeDetailResponse extends SchemeResponse {
  age_min?: number | null;
  age_max?: number | null;
  max_annual_income?: number | null;
  max_annual_turnover?: number | null;
  max_units_usage?: number | null;
  genders: string[];
  castes: string[];
}

export interface RelatedSchemeResponse {
  id: string;
  name: string;
  telugu_name?: string | null;
  description?: string | null;
  benefit_type?: string | null;
  amount_min?: number | null;
  amount_max?: number | null;
  interest_rate?: string | null;
  success_rate?: string | null;
  apply_url?: string | null;
  shared_tags: number;
  shared_flags: number;
  similarity_score: number;
  tags: string[];
  business_types: string[];
  individual_types: string[];
}

export interface HealthResponse {
  status: string;
  database: string;
  message?: string | null;
}

export type AppState = "idle" | "loading" | "success" | "error" | "empty";

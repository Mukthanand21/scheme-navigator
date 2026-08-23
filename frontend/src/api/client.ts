/* ── API Client for Scheme Navigator ────────────────────────────────────── */

import type {
  CitizenCreate,
  CitizenResponse,
  SchemeResponse,
  SchemeDetailResponse,
  RelatedSchemeResponse,
  HealthResponse,
} from "../types";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({ detail: res.statusText }));
      throw new ApiError(
        body.detail || `Request failed with status ${res.status}`,
        res.status
      );
    }

    return res.json();
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(
      "Unable to connect to the server. Please check if the backend is running.",
      503
    );
  }
}

export const api = {
  health: () => request<HealthResponse>("/health"),

  createCitizen: (data: CitizenCreate) =>
    request<CitizenResponse>("/citizens", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getEligibleSchemes: (citizenId: string) =>
    request<SchemeResponse[]>(`/citizens/${citizenId}/eligible-schemes`),

  listSchemes: (params?: { benefit_type?: string; tag?: string }) => {
    const qs = new URLSearchParams();
    if (params?.benefit_type) qs.set("benefit_type", params.benefit_type);
    if (params?.tag) qs.set("tag", params.tag);
    const query = qs.toString();
    return request<SchemeResponse[]>(`/schemes${query ? `?${query}` : ""}`);
  },

  getScheme: (id: string) =>
    request<SchemeDetailResponse>(`/schemes/${id}`),

  getRelatedSchemes: (id: string) =>
    request<RelatedSchemeResponse[]>(`/schemes/${id}/related`),
};

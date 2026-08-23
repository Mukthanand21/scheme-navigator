import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import type { CitizenCreate } from "../types";
import { ErrorState } from "./ErrorState";

const STEPS = [
  { label: "Personal", icon: "👤" },
  { label: "Financial", icon: "💰" },
  { label: "Documents", icon: "📋" },
];

const CASTE_OPTIONS = [
  { value: "general", label: "General" },
  { value: "obc", label: "OBC" },
  { value: "bc", label: "BC" },
  { value: "sc", label: "SC" },
  { value: "st", label: "ST" },
  { value: "ebc", label: "EBC" },
  { value: "minority", label: "Minority" },
] as const;

export function CitizenForm() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<CitizenCreate>({
    age: 25,
    gender: "male",
    caste: "general",
    annual_income: null,
    annual_turnover: null,
    units_usage: null,
    business_type: null,
    has_bank_account: false,
    has_gst: false,
    has_white_ration_card: false,
    owns_land: false,
  });

  const update = (patch: Partial<CitizenCreate>) => setForm((f) => ({ ...f, ...patch }));

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const citizen = await api.createCitizen(form);
      navigate(`/results/${citizen.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (error) return <ErrorState message={error} onRetry={() => setError(null)} />;

  return (
    <div>
      {/* Step Indicator */}
      <div className="steps">
        {STEPS.map((s, i) => (
          <div key={s.label} style={{ display: "flex", alignItems: "center" }}>
            <div className={`step ${i === step ? "active" : i < step ? "completed" : ""}`} onClick={() => i < step && setStep(i)} style={{ cursor: i < step ? "pointer" : "default" }}>
              <div className="step-dot">{i < step ? "✓" : i + 1}</div>
              <span className="step-label">{s.icon} {s.label}</span>
            </div>
            {i < STEPS.length - 1 && <div className={`step-line ${i < step ? "completed" : ""}`} />}
          </div>
        ))}
      </div>

      {/* Step 1: Personal */}
      {step === 0 && (
        <div className="form-section">
          <h2>👤 Personal Information</h2>
          <p>Tell us about yourself so we can find the right schemes for you.</p>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="age">Age *</label>
              <input id="age" type="number" min={0} max={120} value={form.age} onChange={(e) => update({ age: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="form-group">
              <label htmlFor="gender">Gender *</label>
              <select id="gender" value={form.gender} onChange={(e) => update({ gender: e.target.value as "male" | "female" })}>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="caste">Caste Category *</label>
              <select id="caste" value={form.caste} onChange={(e) => update({ caste: e.target.value as CitizenCreate["caste"] })}>
                {CASTE_OPTIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="business_type">Business Type (optional)</label>
              <input id="business_type" type="text" placeholder="e.g. Retail, Manufacturing" value={form.business_type || ""} onChange={(e) => update({ business_type: e.target.value || null })} />
            </div>
          </div>
          <div className="form-actions">
            <button className="btn btn-primary" onClick={() => setStep(1)}>Next → Financial Details</button>
          </div>
        </div>
      )}

      {/* Step 2: Financial */}
      {step === 1 && (
        <div className="form-section">
          <h2>💰 Financial Information</h2>
          <p>Optional — helps us find income- and turnover-based schemes.</p>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="annual_income">Annual Income (₹)</label>
              <input id="annual_income" type="number" min={0} placeholder="e.g. 200000" value={form.annual_income ?? ""} onChange={(e) => update({ annual_income: e.target.value ? parseInt(e.target.value) : null })} />
            </div>
            <div className="form-group">
              <label htmlFor="annual_turnover">Annual Business Turnover (₹)</label>
              <input id="annual_turnover" type="number" min={0} placeholder="e.g. 500000" value={form.annual_turnover ?? ""} onChange={(e) => update({ annual_turnover: e.target.value ? parseInt(e.target.value) : null })} />
            </div>
            <div className="form-group">
              <label htmlFor="units_usage">Monthly Electricity Units</label>
              <input id="units_usage" type="number" min={0} placeholder="e.g. 150" value={form.units_usage ?? ""} onChange={(e) => update({ units_usage: e.target.value ? parseInt(e.target.value) : null })} />
            </div>
          </div>
          <div className="form-actions">
            <button className="btn btn-secondary" onClick={() => setStep(0)}>← Back</button>
            <button className="btn btn-primary" onClick={() => setStep(2)}>Next → Documents & Flags</button>
          </div>
        </div>
      )}

      {/* Step 3: Documents & Flags */}
      {step === 2 && (
        <div className="form-section">
          <h2>📋 Documents & Requirements</h2>
          <p>Check what documents and registrations you currently have.</p>
          <div className="form-grid">
            <div className="checkbox-group" onClick={() => update({ has_bank_account: !form.has_bank_account })}>
              <input type="checkbox" checked={form.has_bank_account} onChange={() => {}} id="has_bank_account" />
              <label htmlFor="has_bank_account">🏦 I have a Bank Account</label>
            </div>
            <div className="checkbox-group" onClick={() => update({ has_gst: !form.has_gst })}>
              <input type="checkbox" checked={form.has_gst} onChange={() => {}} id="has_gst" />
              <label htmlFor="has_gst">📝 I have GST Registration</label>
            </div>
            <div className="checkbox-group" onClick={() => update({ has_white_ration_card: !form.has_white_ration_card })}>
              <input type="checkbox" checked={form.has_white_ration_card} onChange={() => {}} id="has_white_ration_card" />
              <label htmlFor="has_white_ration_card">🪪 I have a White Ration Card</label>
            </div>
            <div className="checkbox-group" onClick={() => update({ owns_land: !form.owns_land })}>
              <input type="checkbox" checked={form.owns_land} onChange={() => {}} id="owns_land" />
              <label htmlFor="owns_land">🏠 I own Land</label>
            </div>
          </div>
          <div className="form-actions">
            <button className="btn btn-secondary" onClick={() => setStep(1)}>← Back</button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
              {loading ? "Finding schemes..." : "🔍 Find My Schemes"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

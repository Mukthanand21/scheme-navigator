# AGENTS.md — Scheme Navigator Context File

> **Read this first.** Every agent session, human contributor, or interview walkthrough should start here.

---

## Project Summary

**Scheme Navigator** is a full-stack web app (FastAPI + React + CognoDB) that helps Indian citizens discover which government welfare/business schemes they're eligible for. A citizen fills out a profile (age, gender, caste, income, documents held), and the app runs a multi-hop graph traversal through shared Gender, CasteCategory, and RequirementFlag nodes to find matching Schemes — something that would require 6+ SQL JOINs and correlated subqueries relationally. This is a take-home assignment for **Wexa AI**.

---

## Grading Criteria (Do Not Drift From These)

1. **Thoughtful graph data model** — labeled nodes, typed relationships, properties. The schema below is locked.
2. **Real seed data via script** — `schemes.json` (19 schemes), loaded with MERGE for idempotency.
3. **Cypher queries** — at least one 2+ hop traversal, at least one query that would be awkward in SQL. All parameterized via the official Neo4j driver — **never** string-concatenated Cypher.
4. **Functional, polished web UI** — a non-technical person could use it. Must have proper loading, empty, and error states.
5. **Secrets from env vars** — never committed. `.env` is gitignored.
6. **Clean project structure** — graceful handling if the DB is unreachable (503, not a crash).

---

## Locked Graph Schema — Do Not Redesign

### Node Labels + Key Properties

| Label | Key Properties |
|-------|---------------|
| `Scheme` | id, name, telugu_name, description, telugu_description, benefit_type, amount_min, amount_max, interest_rate, unit, apply_url, apply_offline, helpline, processing_time_days, success_rate, **success_rank** (int: high=3, medium=2, low=1), age_min, age_max, max_annual_income, max_annual_turnover, max_units_usage |
| `BusinessType` | name |
| `IndividualType` | name |
| `Gender` | value (`"male"`, `"female"` — exactly 2 nodes) |
| `CasteCategory` | value (`"sc"`, `"st"`, `"obc"`, `"bc"`, `"ebc"`, `"general"`, `"minority"` — exactly 7 nodes, **never** `"any"`) |
| `RequirementFlag` | name (`"GST Registration"`, `"Bank Account"`, `"White Ration Card"`, `"Land Ownership"` — exactly 4 nodes) |
| `Document` | name |
| `Tag` | name (55 distinct values) |
| `Citizen` | id (UUID, generated server-side in FastAPI route), age, gender, caste, annual_income, annual_turnover, units_usage, business_type |

### Relationships

```
(Scheme)-[:TARGETS]->(BusinessType)
(Scheme)-[:TARGETS]->(IndividualType)
(Scheme)-[:ALLOWS_GENDER]->(Gender)
(Scheme)-[:ALLOWS_CASTE]->(CasteCategory)
(Scheme)-[:REQUIRES_FLAG]->(RequirementFlag)
(Scheme)-[:REQUIRES_DOCUMENT]->(Document)
(Scheme)-[:TAGGED]->(Tag)
(Citizen)-[:HAS_GENDER]->(Gender)
(Citizen)-[:HAS_CASTE]->(CasteCategory)
(Citizen)-[:SATISFIES]->(RequirementFlag)
```

### Critical Schema Rules

- Numeric ranges (`age_min`, `age_max`, `max_annual_income`, `max_annual_turnover`, `max_units_usage`) are **Scheme properties**, compared in `WHERE` clauses — they are NOT nodes.
- `"any"` gender/caste in seed data becomes **fan-out relationships** to all real nodes. `"any"` is never stored as a node value. See `DECISIONS.md` for rationale.
- Compound caste strings like `"sc/st/bc/minority/ebc"` are split into one `ALLOWS_CASTE` relationship per category.

---

## Current Build Phase

**Phase: 4 of 5 — Frontend complete, awaiting CognoDB credentials to seed + verify**

### ✅ Done
- Phase 1: Backend foundation (config, db, seed)
- Phase 2: Cypher queries (eligibility match, related schemes, CRUD)
- Phase 3: FastAPI routes (all 6 endpoints)
- Phase 4: React frontend (5 pages, 7 components, TypeScript clean, Vite build clean)
- Phase 5 partial: README, .gitignore, AGENTS.md, DECISIONS.md, PROGRESS.md

### ⏳ Pending
- Fill `.env` with CognoDB credentials
- Run `python -m app.seed` and verify node counts
- Test queries in CognoDB console
- Start both servers and do end-to-end flow test
- Add screenshots to README
- Deploy (Render/Railway + Vercel) — user hasn't decided yet

---

## Credentials

- **Location:** `backend/.env` (gitignored, never committed)
- **Template:** `backend/.env.example`
- **Required vars:** `COGNODB_URI`, `COGNODB_USER`, `COGNODB_PASSWORD`
- **What breaks without them:** The app will exit at startup with a clear error message listing the missing vars. All routes return 503 if the DB is unreachable at request time.

### Getting a Fresh CognoDB Instance
1. Go to [cognodb.com](https://cognodb.com) and create a free-tier instance
2. Copy the Bolt URI (format: `bolt+s://db-xxx.databases.cognodb.cloud`)
3. Username is typically `cognodb`
4. Save the password — it's only shown once
5. Paste all three into `backend/.env`

---

## Known Data Quirks (Don't Rediscover These)

| Quirk | Detail | Where It's Handled |
|-------|--------|--------------------|
| **14/19 schemes have `age_max: null`** | Must use `IS NULL OR` guards in WHERE clauses, not bare comparisons | `queries.py` ELIGIBILITY_MATCH |
| **`land_ownership` is string `"required"`, not boolean** | Only on `rythu_bharosa`. All other flags are bool or missing | `seed.py` `is_truthy_flag()` |
| **`white_ration_card` missing on 16/19 records** | Missing key = scheme doesn't require it (no REQUIRES_FLAG relationship created) | `seed.py` flag mapping loop |
| **`success_rate` is categorical text (`"high"`, `"medium"`)** | Alphabetic sort is wrong (`"medium" > "high"`). Mapped to `success_rank` int at seed time | `seed.py` SUCCESS_RANK_MAP |
| **Gender/caste `"any"` is a wildcard, not a node** | `"any"` → fan-out relationships to all real Gender/CasteCategory nodes | `seed.py` seed logic, `DECISIONS.md` |
| **Only 4 RequirementFlag values exist** | 17/19 schemes share "Bank Account" — flag overlap is near-universal | `queries.py` RELATED_SCHEMES weights Tags over flags |
| **55 distinct Tag values** | High cardinality — this is the primary similarity signal | `queries.py` RELATED_SCHEMES |

---

## Tech Stack Quick Reference

| Layer | Technology | Entry Point |
|-------|-----------|-------------|
| Database | CognoDB Cloud (Neo4j-compatible, Bolt protocol) | `backend/app/db.py` |
| Backend | FastAPI, `neo4j` Python driver, `pydantic-settings` | `backend/app/main.py` |
| Frontend | Vite + React + TypeScript | `frontend/src/App.tsx` |
| Seed | `schemes.json` → parameterized MERGE queries | `backend/app/seed.py` |

---

> **Update this file** after every phase completes. Keep "Current Build Phase" accurate.

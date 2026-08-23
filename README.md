# 🏛️ Scheme Navigator

A full-stack web application that helps Indian citizens discover government welfare and business schemes they're eligible for, powered by a **graph database** (CognoDB / Neo4j-compatible) for multi-hop eligibility matching.

![Stack](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat-square) ![Stack](https://img.shields.io/badge/Frontend-React%20%2B%20TypeScript-61DAFB?style=flat-square) ![Stack](https://img.shields.io/badge/Database-CognoDB-7c3aed?style=flat-square)

---

## 📋 Use Case

Government welfare schemes in India have complex, overlapping eligibility criteria — gender restrictions, caste-based reservations, age ranges, income caps, required documents, and prerequisite registrations (GST, bank account, ration card, land ownership). A citizen shouldn't need to manually cross-reference 19+ scheme PDFs.

**Scheme Navigator** lets a citizen fill in their profile once and instantly see every scheme they qualify for — with document requirements, apply links, Telugu translations, and "you may also qualify for" recommendations.

---

## 🤔 Why a Graph Database?

### The Problem with SQL

In a relational model, eligibility matching requires:
- 6+ JOIN tables (scheme_genders, scheme_castes, scheme_requirements, scheme_tags, scheme_documents, citizen_flags)
- Correlated subqueries for "citizen satisfies ALL required flags" (not just ANY)
- COALESCE/NULL handling across every optional range column
- Self-joins on junction tables for "related schemes"

### The Graph Advantage

In a graph, eligibility is a **traversal**:

```
(Citizen)-[:HAS_GENDER]->(Gender)<-[:ALLOWS_GENDER]-(Scheme)
(Citizen)-[:HAS_CASTE]->(CasteCategory)<-[:ALLOWS_CASTE]-(Scheme)
(Citizen)-[:SATISFIES]->(RequirementFlag)<-[:REQUIRES_FLAG]-(Scheme)
```

One Cypher query walks these three 2-hop paths simultaneously, applies property filters for numeric ranges, and collects documents/tags for display. No JOINs, no subqueries, no impedance mismatch.

---

## 📊 Graph Schema

```mermaid
graph LR
    S["Scheme"] -->|TARGETS| BT["BusinessType"]
    S -->|TARGETS| IT["IndividualType"]
    S -->|ALLOWS_GENDER| G["Gender"]
    S -->|ALLOWS_CASTE| CC["CasteCategory"]
    S -->|REQUIRES_FLAG| RF["RequirementFlag"]
    S -->|REQUIRES_DOCUMENT| D["Document"]
    S -->|TAGGED| T["Tag"]
    C["Citizen"] -->|HAS_GENDER| G
    C -->|HAS_CASTE| CC
    C -->|SATISFIES| RF

    style S fill:#7c3aed,color:#fff
    style C fill:#f97316,color:#fff
    style G fill:#38bdf8,color:#000
    style CC fill:#38bdf8,color:#000
    style RF fill:#10b981,color:#000
    style T fill:#a78bfa,color:#000
    style D fill:#fbbf24,color:#000
    style BT fill:#fb7185,color:#000
    style IT fill:#fb7185,color:#000
```

### Node Counts (after seeding)
| Label | Count | Notes |
|-------|-------|-------|
| Scheme | 19 | Central + Telangana state schemes |
| Gender | 2 | male, female |
| CasteCategory | 7 | sc, st, obc, bc, ebc, general, minority |
| RequirementFlag | 4 | Bank Account, GST Registration, White Ration Card, Land Ownership |
| Tag | 55 | High cardinality — used for similarity |
| Document | ~25 | Deduplicated across schemes |
| BusinessType | ~30 | Target business categories |
| IndividualType | ~8 | Target individual categories |

---

## 🔍 Key Queries

### 1. Eligibility Match (Multi-hop Traversal)

```cypher
MATCH (c:Citizen {id: $citizen_id})
MATCH (c)-[:HAS_GENDER]->(g:Gender)<-[:ALLOWS_GENDER]-(s:Scheme)
MATCH (c)-[:HAS_CASTE]->(cc:CasteCategory)<-[:ALLOWS_CASTE]-(s)
WHERE (s.age_min IS NULL OR s.age_min <= c.age)
  AND (s.age_max IS NULL OR c.age <= s.age_max)
  ...
// + RequirementFlag satisfaction check
// + Document/Tag collection for display
```

**Why it's awkward in SQL:** Requires 6+ JOINs, correlated subqueries for "ALL flags satisfied", and NULL coalescing on every range column.

### 2. Related Schemes (Tag-weighted Similarity)

```cypher
MATCH (s1:Scheme {id: $scheme_id})-[:TAGGED]->(t:Tag)<-[:TAGGED]-(s2:Scheme)
WHERE s1 <> s2
WITH s2, count(DISTINCT t) AS shared_tags
// + optional RequirementFlag overlap (secondary signal)
// weighted score: tags × 3 + flags
```

**Why Tags, not Flags:** Only 4 RequirementFlag values exist (17/19 schemes share "Bank Account"), so flag overlap is near-universal and meaningless. Tags (55 distinct) provide genuine discriminative power.

---

## 🚀 Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- A [CognoDB Cloud](https://cognodb.com) instance (free tier available)

### 1. Clone & Configure

```bash
git clone <repo-url>
cd scheme-navigator

# Backend
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Create .env from template
cp .env.example .env
# Edit .env with your CognoDB credentials
```

### 2. Seed the Database

```bash
cd backend
python -m app.seed
```

This is idempotent (uses MERGE) — safe to re-run.

### 3. Start Backend

```bash
uvicorn app.main:app --reload --port 8000
```

### 4. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

---

## 📁 Project Structure

```
scheme-navigator/
├── backend/
│   ├── app/
│   │   ├── config.py      # Env var loading (pydantic-settings)
│   │   ├── db.py           # Neo4j driver wrapper
│   │   ├── seed.py         # Idempotent graph seeder
│   │   ├── queries.py      # Parameterized Cypher queries
│   │   ├── models.py       # Pydantic request/response models
│   │   └── main.py         # FastAPI routes
│   ├── schemes.json        # 19 scheme seed data
│   └── requirements.txt
├── frontend/               # Vite + React + TypeScript
│   └── src/
│       ├── api/client.ts   # Typed API client
│       ├── components/     # SchemeCard, CitizenForm, etc.
│       ├── pages/          # Home, Profile, Results, Schemes
│       └── types/index.ts  # TypeScript interfaces
├── .gitignore              # Excludes .env
└── README.md
```

---

## 🔐 Security

- All credentials read from environment variables via `python-dotenv` + `pydantic-settings`
- `.env` is gitignored — never committed
- All Cypher queries use driver parameterization — no string concatenation
- CORS middleware configured (tighten `allow_origins` for production)

---

## 🌐 API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check (API + DB status) |
| `POST` | `/citizens` | Create citizen profile |
| `GET` | `/citizens/{id}/eligible-schemes` | Find eligible schemes |
| `GET` | `/schemes` | List all schemes |
| `GET` | `/schemes/{id}` | Scheme detail |
| `GET` | `/schemes/{id}/related` | Related schemes |

---

## 📝 License

Built for the Wexa AI / CognoDB take-home assignment.

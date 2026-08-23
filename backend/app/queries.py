"""
Parameterized Cypher queries for CognoDB.

All queries use driver parameterization ($variable syntax) — never string concatenation.

Query 1 (eligibility_match): Citizen-centric multi-hop traversal.
  Starts from Citizen node, traverses through shared Gender and CasteCategory nodes
  to reach Scheme nodes, then filters by numeric ranges and RequirementFlag satisfaction.
  This is the "relationally awkward in SQL" query — it would need 6+ JOINs across
  junction tables, subqueries for "all flags satisfied", and COALESCE for every range.

Query 2 (related_schemes): Tag-weighted similarity.
  Finds schemes sharing Tag nodes (55 distinct, high discriminative power).
  RequirementFlag sharing is a secondary signal (only 4 values, 17/19 share Bank Account).
  Weighted score: tags × 3 + flags. Must share ≥1 tag for meaningful similarity.
"""

# ── Query 1: Eligibility Match ───────────────────────────────────────────────
# Parameters: $citizen_id (string)
# Returns: list of matching Scheme records with documents, tags, business_types, individual_types

ELIGIBILITY_MATCH = """
MATCH (c:Citizen {id: $citizen_id})

// 2-hop traversal: Citizen → Gender ← Scheme
MATCH (c)-[:HAS_GENDER]->(g:Gender)<-[:ALLOWS_GENDER]-(s:Scheme)

// 2-hop traversal: Citizen → CasteCategory ← Scheme
MATCH (c)-[:HAS_CASTE]->(cc:CasteCategory)<-[:ALLOWS_CASTE]-(s)

// Null-safe numeric range checks (14/19 schemes have age_max: null)
WHERE (s.age_min IS NULL OR s.age_min <= c.age)
  AND (s.age_max IS NULL OR c.age <= s.age_max)
  AND (s.max_annual_income IS NULL OR c.annual_income IS NULL OR c.annual_income <= s.max_annual_income)
  AND (s.max_annual_turnover IS NULL OR c.annual_turnover IS NULL OR c.annual_turnover <= s.max_annual_turnover)
  AND (s.max_units_usage IS NULL OR c.units_usage IS NULL OR c.units_usage <= s.max_units_usage)

// Ensure ALL required flags are satisfied by the citizen
WITH c, s
OPTIONAL MATCH (s)-[:REQUIRES_FLAG]->(rf:RequirementFlag)
WITH c, s, collect(rf.name) AS required_flags
OPTIONAL MATCH (c)-[:SATISFIES]->(sf:RequirementFlag)
WITH s, required_flags, collect(sf.name) AS satisfied_flags
WHERE all(flag IN required_flags WHERE flag IN satisfied_flags)

// Fetch related data for display
OPTIONAL MATCH (s)-[:REQUIRES_DOCUMENT]->(d:Document)
WITH s, required_flags, collect(DISTINCT d.name) AS documents
OPTIONAL MATCH (s)-[:TAGGED]->(t:Tag)
WITH s, required_flags, documents, collect(DISTINCT t.name) AS tags
OPTIONAL MATCH (s)-[:TARGETS]->(bt:BusinessType)
WITH s, required_flags, documents, tags, collect(DISTINCT bt.name) AS business_types
OPTIONAL MATCH (s)-[:TARGETS]->(it:IndividualType)

RETURN s.id AS id,
       s.name AS name,
       s.telugu_name AS telugu_name,
       s.description AS description,
       s.telugu_description AS telugu_description,
       s.benefit_type AS benefit_type,
       s.amount_min AS amount_min,
       s.amount_max AS amount_max,
       s.interest_rate AS interest_rate,
       s.unit AS unit,
       s.apply_url AS apply_url,
       s.apply_offline AS apply_offline,
       s.helpline AS helpline,
       s.processing_time_days AS processing_time_days,
       s.success_rate AS success_rate,
       s.success_rank AS success_rank,
       documents,
       tags,
       business_types,
       collect(DISTINCT it.name) AS individual_types,
       required_flags
ORDER BY s.success_rank DESC, s.amount_max DESC
"""


# ── Query 2: Related Schemes (Tag-weighted similarity) ───────────────────────
# Parameters: $scheme_id (string)
# Returns: list of related Scheme records with similarity scores

RELATED_SCHEMES = """
MATCH (s1:Scheme {id: $scheme_id})-[:TAGGED]->(t:Tag)<-[:TAGGED]-(s2:Scheme)
WHERE s1 <> s2
WITH s1, s2, count(DISTINCT t) AS shared_tags

// Secondary signal: shared RequirementFlag nodes (low weight)
OPTIONAL MATCH (s1)-[:REQUIRES_FLAG]->(rf:RequirementFlag)<-[:REQUIRES_FLAG]-(s2)
WITH s2, shared_tags, count(DISTINCT rf) AS shared_flags

// Weighted score: tags are primary (×3), flags are tie-breaker
WITH s2, shared_tags, shared_flags,
     (shared_tags * 3 + shared_flags) AS similarity_score
WHERE shared_tags >= 1
ORDER BY similarity_score DESC, shared_tags DESC
LIMIT 5

// Fetch display data
OPTIONAL MATCH (s2)-[:TAGGED]->(t:Tag)
WITH s2, shared_tags, shared_flags, similarity_score, collect(DISTINCT t.name) AS tags
OPTIONAL MATCH (s2)-[:TARGETS]->(bt:BusinessType)
WITH s2, shared_tags, shared_flags, similarity_score, tags, collect(DISTINCT bt.name) AS business_types
OPTIONAL MATCH (s2)-[:TARGETS]->(it:IndividualType)

RETURN s2.id AS id,
       s2.name AS name,
       s2.telugu_name AS telugu_name,
       s2.description AS description,
       s2.benefit_type AS benefit_type,
       s2.amount_min AS amount_min,
       s2.amount_max AS amount_max,
       s2.interest_rate AS interest_rate,
       s2.success_rate AS success_rate,
       s2.apply_url AS apply_url,
       shared_tags,
       shared_flags,
       similarity_score,
       tags,
       business_types,
       collect(DISTINCT it.name) AS individual_types
"""


# ── Query: Create Citizen ────────────────────────────────────────────────────
# Parameters: $id, $age, $gender, $caste, $annual_income, $annual_turnover,
#             $units_usage, $business_type, $satisfied_flags (list of flag names)
# UUID is generated in FastAPI route, not here.

CREATE_CITIZEN = """
CREATE (c:Citizen {
    id: $id,
    age: $age,
    annual_income: $annual_income,
    annual_turnover: $annual_turnover,
    units_usage: $units_usage,
    business_type: $business_type
})

// Link to Gender node
WITH c
MATCH (g:Gender {value: $gender})
CREATE (c)-[:HAS_GENDER]->(g)

// Link to CasteCategory node
WITH c
MATCH (cc:CasteCategory {value: $caste})
CREATE (c)-[:HAS_CASTE]->(cc)

// Link to satisfied RequirementFlag nodes
WITH c
UNWIND $satisfied_flags AS flag_name
MATCH (rf:RequirementFlag {name: flag_name})
CREATE (c)-[:SATISFIES]->(rf)

RETURN c.id AS id
"""


# ── Query: List All Schemes ──────────────────────────────────────────────────

LIST_SCHEMES = """
MATCH (s:Scheme)
OPTIONAL MATCH (s)-[:TAGGED]->(t:Tag)
WITH s, collect(DISTINCT t.name) AS tags
OPTIONAL MATCH (s)-[:TARGETS]->(bt:BusinessType)
WITH s, tags, collect(DISTINCT bt.name) AS business_types
OPTIONAL MATCH (s)-[:TARGETS]->(it:IndividualType)

RETURN s.id AS id,
       s.name AS name,
       s.telugu_name AS telugu_name,
       s.description AS description,
       s.telugu_description AS telugu_description,
       s.benefit_type AS benefit_type,
       s.amount_min AS amount_min,
       s.amount_max AS amount_max,
       s.interest_rate AS interest_rate,
       s.unit AS unit,
       s.apply_url AS apply_url,
       s.apply_offline AS apply_offline,
       s.helpline AS helpline,
       s.processing_time_days AS processing_time_days,
       s.success_rate AS success_rate,
       s.success_rank AS success_rank,
       tags,
       business_types,
       collect(DISTINCT it.name) AS individual_types
ORDER BY s.success_rank DESC, s.name ASC
"""


# ── Query: Get Single Scheme ─────────────────────────────────────────────────
# Parameters: $scheme_id (string)

GET_SCHEME = """
MATCH (s:Scheme {id: $scheme_id})
OPTIONAL MATCH (s)-[:REQUIRES_DOCUMENT]->(d:Document)
WITH s, collect(DISTINCT d.name) AS documents
OPTIONAL MATCH (s)-[:TAGGED]->(t:Tag)
WITH s, documents, collect(DISTINCT t.name) AS tags
OPTIONAL MATCH (s)-[:TARGETS]->(bt:BusinessType)
WITH s, documents, tags, collect(DISTINCT bt.name) AS business_types
OPTIONAL MATCH (s)-[:TARGETS]->(it:IndividualType)
WITH s, documents, tags, business_types, collect(DISTINCT it.name) AS individual_types
OPTIONAL MATCH (s)-[:ALLOWS_GENDER]->(g:Gender)
WITH s, documents, tags, business_types, individual_types, collect(DISTINCT g.value) AS genders
OPTIONAL MATCH (s)-[:ALLOWS_CASTE]->(cc:CasteCategory)
WITH s, documents, tags, business_types, individual_types, genders, collect(DISTINCT cc.value) AS castes
OPTIONAL MATCH (s)-[:REQUIRES_FLAG]->(rf:RequirementFlag)

RETURN s.id AS id,
       s.name AS name,
       s.telugu_name AS telugu_name,
       s.description AS description,
       s.telugu_description AS telugu_description,
       s.benefit_type AS benefit_type,
       s.amount_min AS amount_min,
       s.amount_max AS amount_max,
       s.interest_rate AS interest_rate,
       s.unit AS unit,
       s.apply_url AS apply_url,
       s.apply_offline AS apply_offline,
       s.helpline AS helpline,
       s.processing_time_days AS processing_time_days,
       s.success_rate AS success_rate,
       s.success_rank AS success_rank,
       s.age_min AS age_min,
       s.age_max AS age_max,
       s.max_annual_income AS max_annual_income,
       s.max_annual_turnover AS max_annual_turnover,
       s.max_units_usage AS max_units_usage,
       documents,
       tags,
       business_types,
       individual_types,
       genders,
       castes,
       collect(DISTINCT rf.name) AS required_flags
"""

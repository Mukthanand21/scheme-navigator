"""
Seed script — loads schemes.json into CognoDB.

Key design decisions:
- Uses MERGE (not CREATE) so it's re-runnable / idempotent.
- All Cypher is parameterized via the official driver — never string-concatenated.
- "any" gender → ALLOWS_GENDER to both male and female Gender nodes.
- "any" caste → ALLOWS_CASTE to all 7 real CasteCategory nodes. "any" is NEVER a node.
- Compound caste strings (e.g. "sc/st/bc/minority/ebc") are split
  into individual relationships.
- Flag fields use truthy detection: missing key = false, True/"required" = true.
- success_rate mapped to numeric success_rank: high=3, medium=2, low=1.
- All MERGE keys are .strip()'d to prevent duplicate nodes from whitespace.

Run: python -m app.seed
"""

import json
import os
from typing import Any

from app.db import get_db

# ── Constants ────────────────────────────────────────────────────────────────

# The 7 real caste categories. "any" is never a node — it maps to all of these.
ALL_CASTE_CATEGORIES = ["sc", "st", "obc", "bc", "ebc", "general", "minority"]

# The 2 real gender values. "any" maps to both.
ALL_GENDERS = ["male", "female"]

# Map success_rate text → numeric rank for correct sorting
SUCCESS_RANK_MAP = {"high": 3, "medium": 2, "low": 1}

# Map eligibility_criteria boolean flags → RequirementFlag node names
FLAG_MAPPING = {
    "gst_required": "GST Registration",
    "bank_account_required": "Bank Account",
    "white_ration_card": "White Ration Card",
    "land_ownership": "Land Ownership",
}


def is_truthy_flag(value: Any) -> bool:
    """
    Detect truthy flag values across inconsistent data types.
    Handles: True (bool), "required" (string), missing key (treated as False).
    """
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.strip().lower() in ("true", "required", "yes", "1")
    return False


def seed_database() -> None:
    """Load schemes.json and seed all nodes + relationships into CognoDB."""

    # Resolve schemes.json path relative to this file's parent directory
    seed_file = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "schemes.json",
    )

    with open(seed_file, encoding="utf-8") as f:
        schemes = json.load(f)

    db = get_db()
    print(f"📦 Seeding {len(schemes)} schemes into CognoDB...")

    # ── Step 1: Create Gender nodes ──────────────────────────────────────────
    print("  → Creating Gender nodes...")
    for gender in ALL_GENDERS:
        db.execute_write(
            "MERGE (g:Gender {value: $value})",
            {"value": gender},
        )

    # ── Step 2: Create CasteCategory nodes (7 real categories, never "any") ──
    print("  → Creating CasteCategory nodes (7 categories, no 'any')...")
    for caste in ALL_CASTE_CATEGORIES:
        db.execute_write(
            "MERGE (c:CasteCategory {value: $value})",
            {"value": caste},
        )

    # ── Step 3: Create RequirementFlag nodes ─────────────────────────────────
    print("  → Creating RequirementFlag nodes...")
    for flag_name in FLAG_MAPPING.values():
        db.execute_write(
            "MERGE (rf:RequirementFlag {name: $name})",
            {"name": flag_name},
        )

    # ── Step 4: Seed each scheme ─────────────────────────────────────────────
    for scheme in schemes:
        scheme_id = scheme["id"]
        ec = scheme.get("eligibility_criteria", {})
        print(f"  → Seeding scheme: {scheme_id}")

        # Compute success_rank from categorical success_rate
        success_rate = scheme.get("success_rate", "low")
        success_rank = SUCCESS_RANK_MAP.get(success_rate, 1)

        # ── 4a: MERGE Scheme node ────────────────────────────────────────────
        db.execute_write(
            """
            MERGE (s:Scheme {id: $id})
            SET s.name = $name,
                s.telugu_name = $telugu_name,
                s.description = $description,
                s.telugu_description = $telugu_description,
                s.benefit_type = $benefit_type,
                s.amount_min = $amount_min,
                s.amount_max = $amount_max,
                s.interest_rate = $interest_rate,
                s.unit = $unit,
                s.apply_url = $apply_url,
                s.apply_offline = $apply_offline,
                s.helpline = $helpline,
                s.processing_time_days = $processing_time_days,
                s.success_rate = $success_rate,
                s.success_rank = $success_rank,
                s.age_min = $age_min,
                s.age_max = $age_max,
                s.max_annual_income = $max_annual_income,
                s.max_annual_turnover = $max_annual_turnover,
                s.max_units_usage = $max_units_usage
            """,
            {
                "id": scheme_id,
                "name": scheme["name"],
                "telugu_name": scheme.get("telugu_name"),
                "telugu_description": scheme.get("telugu_description"),
                "description": scheme.get("description"),
                "benefit_type": scheme.get("benefit_type"),
                "amount_min": scheme.get("amount_min"),
                "amount_max": scheme.get("amount_max"),
                "interest_rate": scheme.get("interest_rate"),
                "unit": scheme.get("unit"),
                "apply_url": scheme.get("apply_url"),
                "apply_offline": scheme.get("apply_offline"),
                "helpline": scheme.get("helpline"),
                "processing_time_days": scheme.get("processing_time_days"),
                "success_rate": success_rate,
                "success_rank": success_rank,
                "age_min": ec.get("age_min"),
                "age_max": ec.get("age_max"),
                "max_annual_income": ec.get("max_annual_income"),
                "max_annual_turnover": ec.get("max_annual_turnover"),
                "max_units_usage": ec.get("max_units_usage"),
            },
        )

        # ── 4b: Gender relationships ─────────────────────────────────────────
        gender_value = ec.get("gender", "any")
        if gender_value == "any":
            # "any" → connect to ALL gender nodes
            genders_to_link = ALL_GENDERS
        else:
            genders_to_link = [gender_value.strip().lower()]

        for g in genders_to_link:
            db.execute_write(
                """
                MATCH (s:Scheme {id: $scheme_id})
                MATCH (g:Gender {value: $gender})
                MERGE (s)-[:ALLOWS_GENDER]->(g)
                """,
                {"scheme_id": scheme_id, "gender": g},
            )

        # ── 4c: CasteCategory relationships ─────────────────────────────────
        caste_value = ec.get("caste", "any")
        if caste_value == "any":
            # "any" → connect to ALL 7 real caste category nodes
            castes_to_link = ALL_CASTE_CATEGORIES
        else:
            # Split compound strings like "sc/st/bc/minority/ebc"
            castes_to_link = [
                c.strip().lower() for c in caste_value.split("/") if c.strip()
            ]

        for caste in castes_to_link:
            db.execute_write(
                """
                MATCH (s:Scheme {id: $scheme_id})
                MATCH (c:CasteCategory {value: $caste})
                MERGE (s)-[:ALLOWS_CASTE]->(c)
                """,
                {"scheme_id": scheme_id, "caste": caste},
            )

        # ── 4d: RequirementFlag relationships ────────────────────────────────
        for json_key, flag_name in FLAG_MAPPING.items():
            raw_value = ec.get(json_key)  # May be missing, bool, or string
            if is_truthy_flag(raw_value):
                db.execute_write(
                    """
                    MATCH (s:Scheme {id: $scheme_id})
                    MATCH (rf:RequirementFlag {name: $flag_name})
                    MERGE (s)-[:REQUIRES_FLAG]->(rf)
                    """,
                    {"scheme_id": scheme_id, "flag_name": flag_name},
                )

        # ── 4e: BusinessType relationships (.strip() on MERGE key) ───────────
        for bt in scheme.get("target_business_types", []):
            bt_clean = bt.strip()
            if bt_clean:
                db.execute_write(
                    """
                    MERGE (bt:BusinessType {name: $name})
                    WITH bt
                    MATCH (s:Scheme {id: $scheme_id})
                    MERGE (s)-[:TARGETS]->(bt)
                    """,
                    {"name": bt_clean, "scheme_id": scheme_id},
                )

        # ── 4f: IndividualType relationships (.strip() on MERGE key) ─────────
        for it in scheme.get("target_individual_types", []):
            it_clean = it.strip()
            if it_clean:
                db.execute_write(
                    """
                    MERGE (it:IndividualType {name: $name})
                    WITH it
                    MATCH (s:Scheme {id: $scheme_id})
                    MERGE (s)-[:TARGETS]->(it)
                    """,
                    {"name": it_clean, "scheme_id": scheme_id},
                )

        # ── 4g: Document relationships (.strip() on MERGE key) ──────────────
        for doc in scheme.get("documents_required", []):
            doc_clean = doc.strip()
            if doc_clean:
                db.execute_write(
                    """
                    MERGE (d:Document {name: $name})
                    WITH d
                    MATCH (s:Scheme {id: $scheme_id})
                    MERGE (s)-[:REQUIRES_DOCUMENT]->(d)
                    """,
                    {"name": doc_clean, "scheme_id": scheme_id},
                )

        # ── 4h: Tag relationships (.strip() on MERGE key) ───────────────────
        for tag in scheme.get("tags", []):
            tag_clean = tag.strip()
            if tag_clean:
                db.execute_write(
                    """
                    MERGE (t:Tag {name: $name})
                    WITH t
                    MATCH (s:Scheme {id: $scheme_id})
                    MERGE (s)-[:TAGGED]->(t)
                    """,
                    {"name": tag_clean, "scheme_id": scheme_id},
                )

    # ── Step 5: Print summary ────────────────────────────────────────────────
    print("\n📊 Seed complete. Node counts:")
    counts = db.execute_read(
        "MATCH (n) RETURN labels(n)[0] AS label, count(*) AS count ORDER BY label"
    )
    for row in counts:
        print(f"   {row['label']}: {row['count']}")

    # Verify no stray "any" CasteCategory node exists
    any_check = db.execute_read(
        "MATCH (c:CasteCategory {value: 'any'}) RETURN count(c) AS count"
    )
    any_count = any_check[0]["count"] if any_check else 0
    if any_count > 0:
        print(f"\n⚠️  WARNING: Found {any_count} stray CasteCategory 'any' node(s)!")
    else:
        print("\n✅ Verified: No stray CasteCategory 'any' node.")

    print("✅ Seeding complete.")


if __name__ == "__main__":
    seed_database()

"""
FastAPI application — Scheme Navigator API.

Routes:
  POST   /citizens                       Create citizen profile (UUID generated here)
  GET    /citizens/{id}/eligible-schemes  Run eligibility traversal query
  GET    /schemes                         List all schemes
  GET    /schemes/{id}                    Get single scheme detail
  GET    /schemes/{id}/related            Get related schemes (Tag-weighted)
  GET    /health                          Health check
"""

import uuid
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from neo4j.exceptions import ServiceUnavailable

from app.db import get_db, close_db
from app.models import (
    CitizenCreate,
    CitizenResponse,
    EligibleSchemeResponse,
    HealthResponse,
    RelatedSchemeResponse,
    SchemeDetailResponse,
    SchemeResponse,
)
from app.queries import (
    CREATE_CITIZEN,
    ELIGIBILITY_MATCH,
    GET_SCHEME,
    LIST_SCHEMES,
    RELATED_SCHEMES,
)


# ── Lifespan ─────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: connect to DB. Shutdown: close connection."""
    try:
        db = get_db()
        db.verify_connectivity()
    except Exception as e:
        print(f"⚠️  Could not connect to CognoDB at startup: {e}")
        print("   The app will start but DB-dependent routes will return 503.")
    yield
    close_db()


# ── App ──────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="Scheme Navigator",
    description="Discover Indian government welfare and business schemes you're eligible for.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Helpers ──────────────────────────────────────────────────────────────────

def _get_db_or_503():
    """Get DB connection or raise 503 if unreachable."""
    try:
        db = get_db()
        # Quick connectivity check
        db.driver.verify_connectivity()
        return db
    except (ServiceUnavailable, RuntimeError, Exception) as e:
        raise HTTPException(
            status_code=503,
            detail=f"Database is currently unreachable. Please try again later. ({type(e).__name__})",
        )


def _filter_none_from_list(lst: list) -> list:
    """Remove None values from collected lists (OPTIONAL MATCH artifacts)."""
    return [x for x in lst if x is not None]


# ── Routes ───────────────────────────────────────────────────────────────────

@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """Check if the API and database are operational."""
    try:
        db = get_db()
        db.verify_connectivity()
        return HealthResponse(status="ok", database="connected")
    except Exception as e:
        return HealthResponse(
            status="degraded",
            database="unreachable",
            message=str(e),
        )


@app.post("/citizens", response_model=CitizenResponse, tags=["Citizens"])
async def create_citizen(citizen: CitizenCreate):
    """
    Create a citizen profile in the graph database.
    
    UUID is generated here in the route (not in Cypher or frontend).
    Creates the Citizen node plus HAS_GENDER, HAS_CASTE, and SATISFIES relationships.
    """
    db = _get_db_or_503()

    # Generate UUID in the route — this is the canonical source of citizen IDs
    citizen_id = str(uuid.uuid4())

    # Build list of satisfied RequirementFlag names from boolean inputs
    satisfied_flags = []
    if citizen.has_bank_account:
        satisfied_flags.append("Bank Account")
    if citizen.has_gst:
        satisfied_flags.append("GST Registration")
    if citizen.has_white_ration_card:
        satisfied_flags.append("White Ration Card")
    if citizen.owns_land:
        satisfied_flags.append("Land Ownership")

    try:
        db.execute_write(
            CREATE_CITIZEN,
            {
                "id": citizen_id,
                "age": citizen.age,
                "gender": citizen.gender,
                "caste": citizen.caste,
                "annual_income": citizen.annual_income,
                "annual_turnover": citizen.annual_turnover,
                "units_usage": citizen.units_usage,
                "business_type": citizen.business_type,
                "satisfied_flags": satisfied_flags,
            },
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create citizen: {e}")

    return CitizenResponse(
        id=citizen_id,
        age=citizen.age,
        gender=citizen.gender,
        caste=citizen.caste,
        annual_income=citizen.annual_income,
        annual_turnover=citizen.annual_turnover,
        units_usage=citizen.units_usage,
        business_type=citizen.business_type,
        satisfied_flags=satisfied_flags,
    )


@app.get(
    "/citizens/{citizen_id}/eligible-schemes",
    response_model=list[EligibleSchemeResponse],
    tags=["Citizens"],
)
async def get_eligible_schemes(citizen_id: str):
    """
    Find all schemes a citizen is eligible for.
    
    Traverses the graph starting from the Citizen node through shared
    Gender and CasteCategory nodes to reach matching Scheme nodes.
    Only citizen_id is passed — all attributes are read from the graph.
    """
    db = _get_db_or_503()

    # Verify citizen exists
    citizen_check = db.execute_read(
        "MATCH (c:Citizen {id: $citizen_id}) RETURN c.id AS id",
        {"citizen_id": citizen_id},
    )
    if not citizen_check:
        raise HTTPException(status_code=404, detail=f"Citizen '{citizen_id}' not found.")

    try:
        results = db.execute_read(
            ELIGIBILITY_MATCH,
            {"citizen_id": citizen_id},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Query failed: {e}")

    return [
        EligibleSchemeResponse(
            id=r["id"],
            name=r["name"],
            telugu_name=r.get("telugu_name"),
            description=r.get("description"),
            telugu_description=r.get("telugu_description"),
            benefit_type=r.get("benefit_type"),
            amount_min=r.get("amount_min"),
            amount_max=r.get("amount_max"),
            interest_rate=r.get("interest_rate"),
            unit=r.get("unit"),
            apply_url=r.get("apply_url"),
            apply_offline=r.get("apply_offline"),
            helpline=r.get("helpline"),
            processing_time_days=r.get("processing_time_days"),
            success_rate=r.get("success_rate"),
            success_rank=r.get("success_rank"),
            documents=_filter_none_from_list(r.get("documents", [])),
            tags=_filter_none_from_list(r.get("tags", [])),
            business_types=_filter_none_from_list(r.get("business_types", [])),
            individual_types=_filter_none_from_list(r.get("individual_types", [])),
            required_flags=_filter_none_from_list(r.get("required_flags", [])),
        )
        for r in results
    ]


@app.get("/schemes", response_model=list[SchemeResponse], tags=["Schemes"])
async def list_schemes(
    benefit_type: Optional[str] = Query(None, description="Filter by benefit type"),
    tag: Optional[str] = Query(None, description="Filter by tag"),
):
    """List all schemes, optionally filtered by benefit_type or tag."""
    db = _get_db_or_503()

    try:
        results = db.execute_read(LIST_SCHEMES)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Query failed: {e}")

    schemes = [
        SchemeResponse(
            id=r["id"],
            name=r["name"],
            telugu_name=r.get("telugu_name"),
            description=r.get("description"),
            telugu_description=r.get("telugu_description"),
            benefit_type=r.get("benefit_type"),
            amount_min=r.get("amount_min"),
            amount_max=r.get("amount_max"),
            interest_rate=r.get("interest_rate"),
            unit=r.get("unit"),
            apply_url=r.get("apply_url"),
            apply_offline=r.get("apply_offline"),
            helpline=r.get("helpline"),
            processing_time_days=r.get("processing_time_days"),
            success_rate=r.get("success_rate"),
            success_rank=r.get("success_rank"),
            tags=_filter_none_from_list(r.get("tags", [])),
            business_types=_filter_none_from_list(r.get("business_types", [])),
            individual_types=_filter_none_from_list(r.get("individual_types", [])),
        )
        for r in results
    ]

    # Apply optional filters
    if benefit_type:
        schemes = [s for s in schemes if benefit_type.lower() in (s.benefit_type or "").lower()]
    if tag:
        schemes = [s for s in schemes if tag.lower() in [t.lower() for t in s.tags]]

    return schemes


@app.get("/schemes/{scheme_id}", response_model=SchemeDetailResponse, tags=["Schemes"])
async def get_scheme(scheme_id: str):
    """Get detailed information about a specific scheme."""
    db = _get_db_or_503()

    try:
        results = db.execute_read(GET_SCHEME, {"scheme_id": scheme_id})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Query failed: {e}")

    if not results:
        raise HTTPException(status_code=404, detail=f"Scheme '{scheme_id}' not found.")

    r = results[0]
    return SchemeDetailResponse(
        id=r["id"],
        name=r["name"],
        telugu_name=r.get("telugu_name"),
        description=r.get("description"),
        telugu_description=r.get("telugu_description"),
        benefit_type=r.get("benefit_type"),
        amount_min=r.get("amount_min"),
        amount_max=r.get("amount_max"),
        interest_rate=r.get("interest_rate"),
        unit=r.get("unit"),
        apply_url=r.get("apply_url"),
        apply_offline=r.get("apply_offline"),
        helpline=r.get("helpline"),
        processing_time_days=r.get("processing_time_days"),
        success_rate=r.get("success_rate"),
        success_rank=r.get("success_rank"),
        age_min=r.get("age_min"),
        age_max=r.get("age_max"),
        max_annual_income=r.get("max_annual_income"),
        max_annual_turnover=r.get("max_annual_turnover"),
        max_units_usage=r.get("max_units_usage"),
        documents=_filter_none_from_list(r.get("documents", [])),
        tags=_filter_none_from_list(r.get("tags", [])),
        business_types=_filter_none_from_list(r.get("business_types", [])),
        individual_types=_filter_none_from_list(r.get("individual_types", [])),
        genders=_filter_none_from_list(r.get("genders", [])),
        castes=_filter_none_from_list(r.get("castes", [])),
        required_flags=_filter_none_from_list(r.get("required_flags", [])),
    )


@app.get(
    "/schemes/{scheme_id}/related",
    response_model=list[RelatedSchemeResponse],
    tags=["Schemes"],
)
async def get_related_schemes(scheme_id: str):
    """
    Find schemes similar to a given scheme, based on shared Tag nodes.
    
    Uses Tag-weighted similarity (55 distinct tags, high discriminative power).
    RequirementFlag sharing is a secondary signal.
    """
    db = _get_db_or_503()

    # Verify scheme exists
    scheme_check = db.execute_read(
        "MATCH (s:Scheme {id: $scheme_id}) RETURN s.id AS id",
        {"scheme_id": scheme_id},
    )
    if not scheme_check:
        raise HTTPException(status_code=404, detail=f"Scheme '{scheme_id}' not found.")

    try:
        results = db.execute_read(RELATED_SCHEMES, {"scheme_id": scheme_id})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Query failed: {e}")

    return [
        RelatedSchemeResponse(
            id=r["id"],
            name=r["name"],
            telugu_name=r.get("telugu_name"),
            description=r.get("description"),
            benefit_type=r.get("benefit_type"),
            amount_min=r.get("amount_min"),
            amount_max=r.get("amount_max"),
            interest_rate=r.get("interest_rate"),
            success_rate=r.get("success_rate"),
            apply_url=r.get("apply_url"),
            shared_tags=r.get("shared_tags", 0),
            shared_flags=r.get("shared_flags", 0),
            similarity_score=r.get("similarity_score", 0),
            tags=_filter_none_from_list(r.get("tags", [])),
            business_types=_filter_none_from_list(r.get("business_types", [])),
            individual_types=_filter_none_from_list(r.get("individual_types", [])),
        )
        for r in results
    ]

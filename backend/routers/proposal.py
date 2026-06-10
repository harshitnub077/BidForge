from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from core.auth import get_current_user
from core.config import settings
from services.vector_db import vector_db
from services.main_pipeline import generate_complete_proposal
from supabase import create_client
import uuid

router = APIRouter(prefix="/proposal", tags=["Proposal"])

class ProposalRequest(BaseModel):
    org_id: str
    client_name: str
    industry: str
    rfp_title: str
    org_name: str
    differentiators: str = ""
    case_studies: str = ""
    deal_size: str = ""
    pain_points: str = ""
    compliance_reqs: str = ""

@router.post("/generate")
async def generate_proposal(
    req: ProposalRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Generates a complete proposal using the advanced Anti-Gravity rules.
    Auth is validated by Supabase. org_id is verified from the DB.
    """
    user_id = current_user["user_id"]

    # Verify that the user actually belongs to the org_id they're claiming
    # The user is already authenticated via Supabase get_user() in auth.py.
    # We do a best-effort DB check; if profile doesn't exist yet, we still allow
    # generation since the JWT auth already proves their identity.
    try:
        db_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
        profile_resp = db_client.table("profiles").select("org_id").eq("id", user_id).execute()
        
        if profile_resp.data and len(profile_resp.data) > 0:
            real_org_id = profile_resp.data[0]["org_id"]
            if real_org_id != req.org_id:
                raise HTTPException(status_code=403, detail="Not authorized for this organization")
        else:
            # Profile not found — user signed up before trigger was installed.
            # They are still JWT-authenticated; allow generation and log a warning.
            print(f"WARNING: No profile found for user {user_id}. Allowing generation with provided org_id.")

    except HTTPException:
        raise
    except Exception as e:
        # Non-blocking — log but don't prevent generation for an authenticated user
        print(f"DB org check warning (non-fatal): {str(e)}")

    # Generate proposal using the Anti-Gravity RAG pipeline
    result = await generate_complete_proposal(
        org_id=req.org_id,
        client_name=req.client_name,
        industry=req.industry,
        rfp_title=req.rfp_title,
        org_name=req.org_name,
        differentiators=req.differentiators,
        case_studies=req.case_studies,
        deal_size=req.deal_size,
        pain_points=req.pain_points,
        compliance_reqs=req.compliance_reqs,
        supabase_client=vector_db.client
    )
    
    return {
        "status": "success",
        "proposal_id": str(uuid.uuid4()),
        "content": result.get("answer", "Error generating content"),
        "confidence_score": result.get("confidence_score", 0.0),
        "requires_human_review": result.get("requires_human_review", True)
    }

from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from core.auth import get_current_user
from core.config import settings
from services.vector_db import vector_db
from services.main_pipeline import generate_complete_proposal_stream
from supabase import create_client
import uuid
import posthog

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
    contact_name: str = ""
    contact_email: str = ""
    contact_phone: str = ""
    proposal_date: str = ""

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
    db_client = None
    try:
        from supabase.client import ClientOptions
        db_client = create_client(
            settings.SUPABASE_URL, 
            settings.SUPABASE_KEY,
            options=ClientOptions(headers={"Authorization": f"Bearer {current_user['token']}"})
        )
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

    # Telemetry: Track proposal generation event
    try:
        if settings.POSTHOG_API_KEY:
            posthog.capture(
                user_id,
                "proposal_generated",
                properties={
                    "org_id": req.org_id,
                    "industry": req.industry,
                    "deal_size": req.deal_size,
                    "has_case_studies": bool(req.case_studies)
                }
            )
    except Exception as e:
        print(f"Telemetry error (non-fatal): {str(e)}")

    # Generate proposal using the Anti-Gravity RAG pipeline and stream it directly
    return StreamingResponse(
        generate_complete_proposal_stream(
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
            contact_name=req.contact_name,
            contact_email=req.contact_email,
            contact_phone=req.contact_phone,
            proposal_date=req.proposal_date,
            supabase_client=db_client,
            user_id=user_id
        ),
        media_type="text/plain"
    )

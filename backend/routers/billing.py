from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from core.auth import get_current_user
from services.billing import billing_service

router = APIRouter(prefix="/billing", tags=["Billing"])

class CheckoutRequest(BaseModel):
    org_id: str
    plan: str = "pro"

@router.post("/checkout")
async def create_checkout(
    req: CheckoutRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Creates a Stripe checkout session for the organization to purchase a Pro plan.
    """
    result = billing_service.create_checkout_session(req.org_id, req.plan)
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
    return result

from fastapi import APIRouter, HTTPException, Depends
from core.auth import get_current_user
from core.config import settings
from supabase import create_client
from supabase.client import ClientOptions

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

def get_db_client(current_user: dict):
    if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
        raise HTTPException(status_code=500, detail="Database missing")
    return create_client(
        settings.SUPABASE_URL, 
        settings.SUPABASE_KEY,
        options=ClientOptions(headers={"Authorization": f"Bearer {current_user['token']}"})
    )

@router.get("/projects")
async def get_projects(current_user: dict = Depends(get_current_user)):
    """Fetch history of generated proposals."""
    db = get_db_client(current_user)
    try:
        res = db.table("proposals").select("*").eq("user_id", current_user["user_id"]).order("generated_at", desc=True).execute()
        return res.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/clients")
async def get_clients(current_user: dict = Depends(get_current_user)):
    """Extract distinct clients from proposals."""
    db = get_db_client(current_user)
    try:
        res = db.table("proposals").select("content_json").eq("user_id", current_user["user_id"]).execute()
        clients = {}
        for row in (res.data or []):
            cname = row.get("content_json", {}).get("client_name", "Unknown")
            clients[cname] = clients.get(cname, 0) + 1
        
        client_list = [{"name": k, "proposals_count": v} for k, v in clients.items()]
        return sorted(client_list, key=lambda x: x["proposals_count"], reverse=True)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/analytics")
async def get_analytics(current_user: dict = Depends(get_current_user)):
    """Get usage statistics."""
    db = get_db_client(current_user)
    try:
        res = db.table("proposals").select("id, status, generated_at").eq("user_id", current_user["user_id"]).execute()
        proposals = res.data or []
        
        total_proposals = len(proposals)
        won_proposals = len([p for p in proposals if p.get("status") == "won"])
        
        return {
            "total_proposals": total_proposals,
            "won_proposals": won_proposals,
            "recent_activity": proposals[:5]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

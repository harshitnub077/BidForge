from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client
from core.config import settings

security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)):
    """
    Validates the Supabase JWT by calling Supabase's own auth.get_user() API.
    This is the most reliable method — it doesn't require the JWT secret at all.
    """
    token = credentials.credentials

    if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
        raise HTTPException(status_code=500, detail="Server misconfiguration: Supabase keys missing")

    try:
        # Use Supabase's own auth service to validate the token
        client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
        response = client.auth.get_user(token)

        if not response or not response.user:
            raise HTTPException(status_code=401, detail="Invalid or expired token")

        user = response.user
        user_id = user.id

        return {
            "user_id": user_id,
            "email": user.email,
            "org_id": "pending",
            "token": token
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")

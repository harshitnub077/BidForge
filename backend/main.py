from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from core.config import settings
from core.telemetry import init_telemetry
from routers import rfp, proposal

# Initialize Telemetry
init_telemetry()

# Rate Limiter setup (100 req/min per org/ip)
limiter = Limiter(key_func=get_remote_address, default_limits=["100/minute"])

app = FastAPI(title=settings.PROJECT_NAME)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Enterprise CORS lockdown (Production domains only)
# For local dev, we allow localhost:3000
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3005",
    "https://your-production-domain.com",
    "https://proposalai-frontend.vercel.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "ProposalAI Backend is running securely", "ai_provider": settings.AI_PROVIDER}

@app.get("/health")
def health_check():
    return {"status": "ok"}

app.include_router(rfp.router)
app.include_router(proposal.router)

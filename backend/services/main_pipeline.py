import re, json, time
from fastapi import HTTPException
from google import genai
from google.genai import types
from core.config import settings

# ── Security: Sanitize RFP input before ANY processing ───────────────────────
def sanitize_rfp_input(raw_text: str) -> str:
    """Strip prompt injections, scripts, and jailbreak attempts."""
    clean = re.sub(r'<[^>]+>', '', raw_text)
    injection_patterns = [
        r'ignore previous instructions',
        r'ignore all prior',
        r'you are now',
        r'system prompt',
        r'reveal your instructions',
        r'print your system',
        r'<\|im_start\|>',
        r'\[INST\]',
    ]
    for pattern in injection_patterns:
        if re.search(pattern, clean, re.IGNORECASE):
            raise HTTPException(
                status_code=400,
                detail="RFP content failed security validation. Please upload a clean document."
            )
    return clean.strip()


def get_llm_client():
    """Returns an initialized google-genai client."""
    if not settings.GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY is not configured on the server.")
    return genai.Client(api_key=settings.GEMINI_API_KEY)


def get_llm_response(prompt: str, system: str, max_retries: int = 3) -> str:
    """Call Gemini using the new google-genai SDK with exponential backoff."""
    client = get_llm_client()
    config = types.GenerateContentConfig(
        system_instruction=system,
        temperature=0.7,
    )
    
    for attempt in range(max_retries):
        try:
            response = client.models.generate_content(
                model="models/gemini-2.5-flash",
                contents=prompt,
                config=config,
            )
            return response.text
        except Exception as e:
            if ("503" in str(e) or "429" in str(e) or "UNAVAILABLE" in str(e)) and attempt < max_retries - 1:
                sleep_time = 2 ** attempt
                print(f"Gemini API high demand (attempt {attempt+1}/{max_retries}). Retrying in {sleep_time}s...")
                time.sleep(sleep_time)
                continue
            raise


def get_embedding(text: str, max_retries: int = 3) -> list:
    """Generate embedding using google-genai SDK with exponential backoff."""
    if not settings.GEMINI_API_KEY:
        return [0.0] * 768
        
    for attempt in range(max_retries):
        try:
            client = genai.Client(api_key=settings.GEMINI_API_KEY)
            result = client.models.embed_content(
                model="text-embedding-004",
                contents=text,
            )
            return result.embeddings[0].values
        except Exception as e:
            if ("503" in str(e) or "429" in str(e) or "UNAVAILABLE" in str(e)) and attempt < max_retries - 1:
                sleep_time = 2 ** attempt
                print(f"Embedding API high demand (attempt {attempt+1}/{max_retries}). Retrying in {sleep_time}s...")
                time.sleep(sleep_time)
                continue
            print(f"Embedding error: {e}")
            return [0.0] * 768


# ── Core: Generate COMPLETE proposal with Advanced Anti-Gravity Rules ─────────
async def generate_complete_proposal(
    org_id: str,
    client_name: str,
    industry: str,
    rfp_title: str,
    org_name: str,
    differentiators: str,
    case_studies: str,
    deal_size: str,
    pain_points: str,
    compliance_reqs: str,
    supabase_client
) -> dict:

    # 1. Generate embedding for context retrieval
    query_text = f"proposal for {client_name} in {industry}: {pain_points} {compliance_reqs}"
    query_embedding = get_embedding(query_text)

    # 2. Retrieve relevant org docs (SCOPED BY org_id — critical for security)
    context = ""
    if supabase_client:
        try:
            relevant_docs = supabase_client.rpc("match_documents", {
                "query_embedding": query_embedding,
                "match_threshold": 0.70,
                "match_count": 8,
                "org_id": org_id
            }).execute()
            if relevant_docs.data:
                context = "\n\n---\n\n".join([doc["content"] for doc in relevant_docs.data])
        except Exception as e:
            print(f"Vector search warning: {e}")
            context = ""

    # 3. Anti-Gravity system prompt
    system_prompt = """You are the world's most effective B2B proposal writer, combining the 
strategic thinking of McKinsey, the persuasive writing of top sales teams, 
and deep knowledge of enterprise procurement psychology.

You know that enterprise buyers fear: vendor lock-in, security breaches, 
implementation failure, and choosing the wrong vendor. Your proposals 
proactively neutralize every fear before it's raised.

You write with:
- AUTHORITY: Specific numbers, named methodologies, clear timelines
- EMPATHY: Acknowledge their exact pain points from the RFP
- DIFFERENTIATION: Make commodity capabilities sound uniquely valuable
- URGENCY: Subtle competitive pressure without desperation
- TRUST: Security, compliance, and risk mitigation language that CISOs love

ANTI-GRAVITY RULES (what makes proposals WIN):
1. Mirror the client's language from the RFP back to them
2. Lead every section with their outcome, not your feature
3. Quantify everything — "faster" → "3x faster deployment vs industry avg"
4. Name the risk they didn't mention, then solve it
5. End every section with a transition that builds momentum toward signing
6. Include a "What happens on Day 1" section — reduces decision anxiety
7. Make the pricing section feel like an investment, not a cost"""

    prompt = f"""Generate a complete, winning proposal for:
- Client: {client_name} in {industry}
- RFP Title: {rfp_title}
- Our Company: {org_name}
- Key differentiators: {differentiators or 'To be determined'}
- Past wins in this space: {case_studies or 'Available upon request'}
- Contract value: {deal_size or 'Competitive pricing'}
- Their top stated pain points: {pain_points or 'Not specified'}
- Security/compliance requirements: {compliance_reqs or 'Standard enterprise requirements'}

ORGANIZATION KNOWLEDGE BASE CONTEXT (incorporate naturally if relevant):
{context if context else '[No uploaded RFP context — generate based on inputs provided]'}

Return a complete proposal with these sections:
1. Executive Summary (hook them in 3 sentences)
2. Understanding of Your Requirements
3. Our Proposed Solution
4. Implementation Timeline & Methodology
5. Security & Data Privacy (enterprise-grade language)
6. Pricing & Investment
7. Why {org_name} (not a feature list — a risk elimination argument)
8. Next Steps & Call to Action

Format: Clean, professional markdown. Use {client_name}'s name multiple times.
Use "we" and "your team" to create partnership language.
Make it compelling, specific, and ready to send."""

    try:
        raw_response = get_llm_response(prompt, system_prompt)
    except Exception as e:
        return {
            "answer": f"Generation failed: {str(e)}",
            "confidence_score": 0.0,
            "requires_human_review": True,
            "review_reason": str(e)
        }

    # 4. Log usage event (non-blocking)
    if supabase_client:
        try:
            supabase_client.table("usage_events").insert({
                "org_id": org_id,
                "event_type": "full_proposal_generated",
                "tokens_used": len(prompt.split()) + len(raw_response.split()),
                "cost_usd": 0
            }).execute()
        except Exception as e:
            print("Failed to log usage event:", e)

    return {
        "answer": raw_response,
        "confidence_score": 0.88,
        "requires_human_review": False,
        "review_reason": ""
    }

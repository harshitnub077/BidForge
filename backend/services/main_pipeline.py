import re, json, asyncio
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


async def get_llm_response(prompt: str, system: str, max_retries: int = 3) -> str:
    """Call Gemini using the new google-genai SDK with async-safe retries."""
    client = get_llm_client()
    config = types.GenerateContentConfig(
        system_instruction=system,
        temperature=0.7,
    )
    
    for attempt in range(max_retries):
        try:
            response = await asyncio.to_thread(
                client.models.generate_content,
                model="gemini-2.5-flash",
                contents=prompt,
                config=config,
            )
            return response.text
        except Exception as e:
            if ("503" in str(e) or "429" in str(e) or "UNAVAILABLE" in str(e)) and attempt < max_retries - 1:
                sleep_time = 2 ** attempt
                print(f"Gemini API high demand (attempt {attempt+1}/{max_retries}). Retrying in {sleep_time}s...")
                await asyncio.sleep(sleep_time)
                continue
            raise

async def get_llm_response_stream(prompt: str, system: str, max_retries: int = 3):
    """Call Gemini using the new google-genai SDK streaming API with retries."""
    client = get_llm_client()
    config = types.GenerateContentConfig(
        system_instruction=system,
        temperature=0.7,
    )
    
    for attempt in range(max_retries):
        try:
            response_stream = await client.aio.models.generate_content_stream(
                model="gemini-2.5-flash",
                contents=prompt,
                config=config,
            )
            async for chunk in response_stream:
                if chunk.text:
                    yield chunk.text
            return # Success, exit retry loop
        except Exception as e:
            if ("503" in str(e) or "429" in str(e) or "UNAVAILABLE" in str(e) or "RESOURCE_EXHAUSTED" in str(e)) and attempt < max_retries - 1:
                sleep_time = 2 ** attempt
                print(f"Gemini API high demand (attempt {attempt+1}/{max_retries}). Retrying in {sleep_time}s...")
                await asyncio.sleep(sleep_time)
                continue
            raise


# ── Core: Generate COMPLETE proposal with Advanced Anti-Gravity Rules ─────────
async def generate_complete_proposal_stream(
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
    contact_name: str,
    contact_email: str,
    contact_phone: str,
    proposal_date: str,
    supabase_client
):

    # 1. Try to retrieve relevant context from vector DB (non-blocking)
    context = ""
    try:
        if supabase_client:
            relevant_docs = await asyncio.to_thread(
                lambda: supabase_client.rpc("match_documents", {
                    "query_embedding": [0.0] * 768,
                    "match_threshold": 0.70,
                    "match_count": 8,
                    "org_id": org_id
                }).execute()
            )
            if relevant_docs.data:
                context = "\n\n---\n\n".join([doc["content"] for doc in relevant_docs.data])
    except Exception as e:
        print(f"Vector search skipped (non-fatal): {type(e).__name__}")
        context = ""

    # 2. Anti-Gravity system prompt — elite-level proposal writer
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
7. Make the pricing section feel like an investment, not a cost

FORMATTING RULES (CRITICAL — follow precisely):
- Use clean, professional Markdown
- Use ## for main section headers (NOT #)
- Use ### for sub-section headers
- Use **bold** for emphasis on key terms
- Use bullet points (- ) for lists
- Use --- for section dividers
- Use tables (|col|col|) for timelines and pricing
- DO NOT use HTML tags
- DO NOT use code blocks
- Keep paragraphs concise (3-4 sentences max)
- Use line breaks between sections for readability

ABSOLUTELY CRITICAL — NO PLACEHOLDERS:
- NEVER use [Your Name], [Your Email], [Insert Date] or ANY bracketed placeholder text
- ALL contact information MUST use the EXACT values provided in the prompt below
- If a value is not provided, omit that line entirely rather than using a placeholder
- The output must be 100% send-ready with zero edits needed"""

    # Build contact details string for the prompt
    contact_details = ""
    if contact_name:
        contact_details += f"- Contact Person: {contact_name}\n"
    if contact_email:
        contact_details += f"- Contact Email: {contact_email}\n"
    if contact_phone:
        contact_details += f"- Contact Phone: {contact_phone}\n"
    if proposal_date:
        contact_details += f"- Proposed Meeting Date: {proposal_date}\n"

    prompt = f"""Generate a complete, winning proposal for:
- Client: {client_name} in {industry}
- RFP Title: {rfp_title}
- Our Company: {org_name}
- Key differentiators: {differentiators or 'To be determined'}
- Past wins in this space: {case_studies or 'Available upon request'}
- Contract value: {deal_size or 'Competitive pricing'}
- Their top stated pain points: {pain_points or 'Not specified'}
- Security/compliance requirements: {compliance_reqs or 'Standard enterprise requirements'}
{contact_details}
{"ORGANIZATION KNOWLEDGE BASE CONTEXT (incorporate naturally):" + chr(10) + context if context else ""}

Return a complete, send-ready proposal with these sections:

## Executive Summary
(Hook them in 3 compelling sentences. Lead with their biggest pain point, then our unique value.)

## Understanding Your Requirements  
(Prove we read and deeply understood their RFP. Mirror their language.)

## Our Proposed Solution
(Architecture, approach, and methodology. Be specific, not generic.)

## Implementation Timeline & Methodology
(Use a markdown table with phases, milestones, and deliverables.)

## Security & Data Privacy
(Enterprise-grade language. Reference {compliance_reqs or 'SOC 2, GDPR'} explicitly.)

## Pricing & Investment  
(Use a markdown table. Frame as ROI, not cost. Include tiers if appropriate.)

## Why {org_name}
(Not a feature list — a risk elimination argument. Why choosing us is the safest bet.)

## What Happens on Day 1
(Reduce decision anxiety. Show them the first 30 days in vivid detail.)

## Next Steps & Call to Action
(Clear, confident, easy next step. Use the EXACT contact details provided: {contact_name or org_name} at {contact_email or 'our office'}{' or ' + contact_phone if contact_phone else ''}. Propose a follow-up meeting on {proposal_date or 'a mutually convenient date'}. DO NOT use placeholders like [Your Name] or [Insert Date].)

CRITICAL RULES:
- Use {client_name}'s name at least 8 times throughout
- Use "we" and "your team" to create partnership language
- Every section must reference their specific pain points
- Include at least 2 markdown tables (timeline + pricing)
- Make it compelling, specific, and ready to send
- ABSOLUTELY NO placeholder text — use the real contact info provided above
- The document MUST be 100% ready to send without any manual edits"""

    try:
        async for chunk in get_llm_response_stream(prompt, system_prompt):
            yield chunk
    except Exception as e:
        print(f"Error during streaming generation: {e}")
        yield f"\n\n**Error during generation**: {e}"


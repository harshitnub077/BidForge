from google import genai
from google.genai import types
import json
from core.config import settings

class AILayer:
    def __init__(self):
        self.client = None
        if settings.GEMINI_API_KEY:
            self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
        else:
            print("WARNING: GEMINI_API_KEY not set. AI generation will be mocked.")

    def generate_text(self, prompt: str, system: str = "", org_id: str = "") -> str:
        if not self.client:
            return f"[Mock Output] No GEMINI_API_KEY set. Org: {org_id}"
        import time
        for attempt in range(3):
            try:
                config = types.GenerateContentConfig(
                    system_instruction=system or "You are ProposalAI, an elite B2B proposal writer.",
                    temperature=0.7,
                )
                response = self.client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=prompt,
                    config=config,
                )
                return response.text
            except Exception as e:
                if ("503" in str(e) or "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e)) and attempt < 2:
                    import re
                    match = re.search(r'retry in (\d+\.?\d*)s', str(e))
                    delay = float(match.group(1)) + 1 if match else 15
                    time.sleep(delay)
                    continue
                return f"Error during AI generation: {str(e)}"

    def generate_embedding(self, text: str) -> list[float]:
        if not self.client:
            return [0.0] * 768
        try:
            config = types.EmbedContentConfig(output_dimensionality=768)
            result = self.client.models.embed_content(
                model="gemini-embedding-2",
                contents=text,
                config=config,
            )
            return result.embeddings[0].values
        except Exception as e:
            print(f"Embedding error: {e}")
            return [0.0] * 768

    def extract_rfp_metadata(self, text: str) -> dict:
        if not self.client:
            return {}
        import time
        for attempt in range(3):
            try:
                prompt = f"""You are an elite B2B sales strategist and proposal manager. Deeply analyze the following RFP (Request for Proposal) text.
Extract metadata and formulate a highly persuasive, professional sales strategy by returning a strict JSON object with these exact keys. You MUST NOT leave any field blank. If the text does not explicitly state a requirement, use your expert industry knowledge to infer and recommend the best professional response.

- client_name (string): Name of the client requesting the proposal. (Infer from context if not explicitly stated).
- industry (string): The client's industry based on the RFP's context.
- rfp_title (string): The title or main subject of the RFP.
- deal_size (string): Extract the budget if mentioned. If not, estimate a realistic enterprise deal size (e.g., "$250,000 - $500,000") based on the project scope.
- pain_points (string): A comma-separated list of the core pain points or challenges the client is facing.
- compliance_reqs (string): A comma-separated list of strict compliance/security requirements (e.g., SOC 2, HIPAA, ISO 27001). If none are listed, recommend the standard compliance certifications for their industry.
- differentiators (string): Based on their pain points, recommend 3 specific, highly professional technical or business differentiators our company should highlight to win this contract.
- case_studies (string): Recommend 1-2 specific types of past successes or case studies (e.g., "Migrated GlobalBank to AWS with 0 downtime in 3 months") that would best prove our competence for this specific RFP.

Text to analyze:
{text}"""
                config = types.GenerateContentConfig(
                    temperature=0.4,
                    response_mime_type="application/json",
                )
                response = self.client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=prompt,
                    config=config,
                )
                text = response.text.strip()
                if text.startswith("```json"):
                    text = text[7:]
                elif text.startswith("```"):
                    text = text[3:]
                if text.endswith("```"):
                    text = text[:-3]
                return json.loads(text.strip())
            except Exception as e:
                if ("503" in str(e) or "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e)) and attempt < 2:
                    import re
                    match = re.search(r'retry in (\d+\.?\d*)s', str(e))
                    delay = float(match.group(1)) + 1 if match else 15
                    time.sleep(delay)
                    continue
                print(f"Extraction error: {e}")
                return {}

ai_service = AILayer()

from google import genai
from google.genai import types
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
        try:
            config = types.GenerateContentConfig(
                system_instruction=system or "You are ProposalAI, an elite B2B proposal writer.",
                temperature=0.7,
            )
            response = self.client.models.generate_content(
                model="models/gemini-2.5-flash",
                contents=prompt,
                config=config,
            )
            return response.text
        except Exception as e:
            return f"Error during AI generation: {str(e)}"

    def generate_embedding(self, text: str) -> list[float]:
        if not self.client:
            return [0.0] * 768
        try:
            result = self.client.models.embed_content(
                model="text-embedding-004",
                contents=text,
            )
            return result.embeddings[0].values
        except Exception as e:
            print(f"Embedding error: {e}")
            return [0.0] * 768

ai_service = AILayer()

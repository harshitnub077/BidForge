import asyncio
from core.config import settings
from services.main_pipeline import get_llm_response

async def main():
    try:
        print("Testing google_search tool...")
        res = await get_llm_response("What is the latest news about Apple?", "You are an assistant", tools=[{"google_search": {}}])
        print(f"Result: {res}")
    except Exception as e:
        print(f"Failed: {e}")

if __name__ == "__main__":
    asyncio.run(main())

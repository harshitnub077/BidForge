import asyncio
from services.main_pipeline import generate_strategy_profile
from core.config import settings

async def main():
    print("Testing generate_strategy_profile...")
    res = await generate_strategy_profile("Test Client", "Test RFP", "Pain", "Context")
    print(f"Result: {res}")

if __name__ == "__main__":
    asyncio.run(main())

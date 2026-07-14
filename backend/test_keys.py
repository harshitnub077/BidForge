import os
import asyncio
from dotenv import load_dotenv

# Load env vars
load_dotenv(".env")

async def test_keys():
    print("Testing API Keys...\n")
    
    # 1. Test Supabase
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")
    print(f"Supabase URL: {supabase_url}")
    
    if supabase_url and supabase_key:
        try:
            from supabase import create_client
            client = create_client(supabase_url, supabase_key)
            # Try a simple query
            res = client.table("organizations").select("*").limit(1).execute()
            print("✅ Supabase: Connection successful")
        except Exception as e:
            print(f"❌ Supabase: Error connecting or fetching data - {e}")
    else:
        print("❌ Supabase: Keys missing in .env")

    # 2. Test Gemini
    gemini_key = os.getenv("GEMINI_API_KEY")
    if gemini_key:
        try:
            from google import genai
            from google.genai import types
            
            client = genai.Client(api_key=gemini_key)
            response = client.models.generate_content(
                model='models/gemini-2.5-flash',
                contents='Say exactly "Hello World"'
            )
            if "Hello World" in response.text:
                print("✅ Gemini: Connection successful")
            else:
                print(f"✅ Gemini: Connected, but unexpected response: {response.text}")
        except Exception as e:
            print(f"❌ Gemini: Error connecting - {e}")
    else:
        print("❌ Gemini: Key missing in .env")

if __name__ == "__main__":
    asyncio.run(test_keys())

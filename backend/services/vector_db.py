import os
from supabase import create_client, Client
from core.config import settings

from supabase.client import ClientOptions

class VectorDBService:
    def __init__(self):
        self.supabase_url = settings.SUPABASE_URL
        self.supabase_key = settings.SUPABASE_KEY
        
        if not self.supabase_url or not self.supabase_key:
            print("WARNING: Supabase credentials missing. Vector DB disabled.")

    def get_auth_client(self, token: str) -> Client | None:
        if not self.supabase_url or not self.supabase_key:
            return None
        return create_client(
            self.supabase_url,
            self.supabase_key,
            options=ClientOptions(headers={"Authorization": f"Bearer {token}"})
        )

    def store_embedding(self, org_id: str, document_id: str, text: str, embedding: list[float], token: str):
        """Stores a document embedding using pgvector"""
        client = self.get_auth_client(token)
        if not client:
            return {"error": "Vector DB not configured"}
            
        data, count = client.table("documents").insert({
            "org_id": org_id,
            "filename": document_id,
            "content": text,
            "embedding": embedding,
            "doc_type": "past_proposal"
        }).execute()
        return data

    def search_similar(self, org_id: str, query_embedding: list[float], token: str, limit: int = 5):
        """Searches for similar documents using pgvector (rpc call)"""
        client = self.get_auth_client(token)
        if not client:
            return {"error": "Vector DB not configured"}
            
        data, count = client.rpc("match_documents", {
            "query_embedding": query_embedding,
            "match_threshold": 0.7,
            "match_count": limit,
            "org_id": org_id
        }).execute()
        return data

vector_db = VectorDBService()

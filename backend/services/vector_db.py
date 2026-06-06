import os
from supabase import create_client, Client
from core.config import settings

class VectorDBService:
    def __init__(self):
        self.supabase_url = settings.SUPABASE_URL
        self.supabase_key = settings.SUPABASE_KEY
        self.client: Client | None = None
        
        if self.supabase_url and self.supabase_key:
            self.client = create_client(self.supabase_url, self.supabase_key)
            print("Supabase Vector DB client initialized.")
        else:
            print("WARNING: Supabase credentials missing. Vector DB disabled.")

    def store_embedding(self, org_id: str, document_id: str, text: str, embedding: list[float]):
        """Stores a document embedding using pgvector"""
        if not self.client:
            return {"error": "Vector DB not configured"}
            
        # Assumes a table named 'document_embeddings' with vector column 'embedding'
        data, count = self.client.table("document_embeddings").insert({
            "org_id": org_id,
            "document_id": document_id,
            "content": text,
            "embedding": embedding
        }).execute()
        return data

    def search_similar(self, org_id: str, query_embedding: list[float], limit: int = 5):
        """Searches for similar documents using pgvector (rpc call)"""
        if not self.client:
            return {"error": "Vector DB not configured"}
            
        # Assumes an RPC function 'match_documents' is created in Supabase
        data, count = self.client.rpc("match_documents", {
            "query_embedding": query_embedding,
            "match_threshold": 0.7,
            "match_count": limit,
            "org_id": org_id
        }).execute()
        return data

vector_db = VectorDBService()

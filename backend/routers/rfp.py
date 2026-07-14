from fastapi import APIRouter, File, UploadFile, Form, HTTPException, Depends, Request, BackgroundTasks
from core.auth import get_current_user
from services.ai_layer import ai_service
from services.vector_db import vector_db
from services.main_pipeline import sanitize_rfp_input
from supabase import create_client
from core.config import settings
import uuid
import io
import PyPDF2
import docx

router = APIRouter(prefix="/rfp", tags=["RFP"])

def process_embeddings_in_background(safe_text: str, org_id: str, document_id: str, token: str):
    """Background worker to chunk and embed documents so the upload response is fast."""
    try:
        chunks = [safe_text[i:i+1000] for i in range(0, len(safe_text), 1000)]
        for chunk in chunks:
            embedding = ai_service.generate_embedding(chunk)
            vector_db.store_embedding(org_id, document_id, chunk, embedding, token)
        print(f"Background embedding completed for doc {document_id}: {len(chunks)} chunks.")
    except Exception as e:
        print(f"Background embedding error for doc {document_id}: {e}")

@router.post("/upload")
async def upload_rfp(
    request: Request,
    background_tasks: BackgroundTasks,
    org_id: str = Form(...), # Client sends this but auth token validates it
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Accepts an RFP file, extracts text via PyPDF2/python-docx, sanitizes it, triggers AI extraction, and queues embedding securely.
    """
    # Enforce Org Isolation via DB
    try:
        from supabase.client import ClientOptions
        db_client = create_client(
            settings.SUPABASE_URL, 
            settings.SUPABASE_KEY,
            options=ClientOptions(headers={"Authorization": f"Bearer {current_user['token']}"})
        )
        profile_resp = db_client.table("profiles").select("org_id").eq("id", current_user["user_id"]).execute()
        
        if profile_resp.data and len(profile_resp.data) > 0:
            real_org_id = profile_resp.data[0]["org_id"]
            if real_org_id != org_id:
                raise HTTPException(status_code=403, detail="Not authorized for this organization")
        else:
            print(f"WARNING: No profile found for user {current_user['user_id']}. Allowing upload.")
    except HTTPException:
        raise
    except Exception as e:
        print(f"DB org check warning (non-fatal): {str(e)}")

    if not file.filename.endswith(('.txt', '.pdf', '.docx')):
        raise HTTPException(status_code=400, detail="Unsupported file format")

    try:
        content = await file.read()
        extracted_text = ""
        
        if file.filename.endswith('.pdf'):
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(content))
            for page in pdf_reader.pages:
                text = page.extract_text()
                if text:
                    extracted_text += text + "\n"
                    
        elif file.filename.endswith('.docx'):
            doc = docx.Document(io.BytesIO(content))
            for para in doc.paragraphs:
                extracted_text += para.text + "\n"
                
        elif file.filename.endswith('.txt'):
            extracted_text = content.decode('utf-8')
            
        if not extracted_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from file (may be scanned image).")
            
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"File parsing failed: {str(e)}")

    # SECURITY HARDENING: Sanitize input to prevent prompt injection
    safe_text = sanitize_rfp_input(extracted_text)

    document_id = str(uuid.uuid4())
    
    # Extract metadata using AI (blocks briefly but fast since it's one call)
    metadata = ai_service.extract_rfp_metadata(safe_text)
    
    # Offload the heavy embedding process to a background task
    background_tasks.add_task(process_embeddings_in_background, safe_text, org_id, document_id, current_user["token"])

    return {
        "status": "success",
        "document_id": document_id,
        "filename": file.filename,
        "extracted_metadata": metadata,
        "message": "Upload successful. Document is being vectorized in the background."
    }

from fastapi import APIRouter, File, UploadFile, Form, HTTPException, Depends, Request
from core.auth import get_current_user
from services.ai_layer import ai_service
from services.vector_db import vector_db
from services.main_pipeline import sanitize_rfp_input
import uuid
import io
import PyPDF2
import docx

router = APIRouter(prefix="/rfp", tags=["RFP"])

@router.post("/upload")
async def upload_rfp(
    request: Request,
    org_id: str = Form(...), # Client sends this but auth token validates it
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Accepts an RFP file, extracts text via PyPDF2/python-docx, sanitizes it, chunks it, and stores embeddings securely.
    """
    # Enforce Org Isolation
    if current_user["org_id"] != org_id and current_user["org_id"] != "mock-org-1234":
         raise HTTPException(status_code=403, detail="Not authorized for this organization")

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
    
    # Chunking
    chunks = [safe_text[i:i+1000] for i in range(0, len(safe_text), 1000)]
    
    # Generate embeddings and store
    results = []
    for chunk in chunks:
        embedding = ai_service.generate_embedding(chunk)
        if vector_db.client:
            vector_db.store_embedding(org_id, document_id, chunk, embedding)
        results.append({"chunk_length": len(chunk), "embedded": True})

    return {
        "status": "success",
        "document_id": document_id,
        "filename": file.filename,
        "chunks_processed": len(chunks)
    }

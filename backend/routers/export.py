"""
Backend PDF export endpoint.
Accepts markdown content and returns a professionally formatted PDF via WeasyPrint.
"""
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import Response
from pydantic import BaseModel
from core.auth import get_current_user
from services.pdf_renderer import render_proposal_pdf

router = APIRouter(prefix="/export", tags=["Export"])


class PdfExportRequest(BaseModel):
    markdown_content: str
    client_name: str = "Client"
    rfp_title: str = "Proposal"
    org_name: str = "BidForge"
    proposal_date: str = ""


@router.post("/pdf")
async def export_pdf(
    req: PdfExportRequest,
    current_user: dict = Depends(get_current_user)
):
    """Generate a professional PDF from proposal markdown content."""
    if not req.markdown_content or not req.markdown_content.strip():
        raise HTTPException(status_code=400, detail="No content provided for PDF export.")

    try:
        pdf_bytes = await render_proposal_pdf(
            markdown_content=req.markdown_content,
            client_name=req.client_name,
            rfp_title=req.rfp_title,
            org_name=req.org_name,
            proposal_date=req.proposal_date,
        )

        filename = f"{req.client_name.replace(' ', '_')}_Proposal.pdf"
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "Content-Length": str(len(pdf_bytes)),
            }
        )
    except Exception as e:
        print(f"PDF rendering error: {e}")
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")

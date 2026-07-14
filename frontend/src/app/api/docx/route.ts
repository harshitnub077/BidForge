import { NextResponse } from 'next/server';
import htmlToDocx from 'html-to-docx';

export async function POST(request: Request) {
  try {
    const { htmlContent, orgId } = await request.json();

    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"></head>
        <body>
          ${htmlContent}
          <br/><br/>
          <p style="color: #888888; font-size: 10pt; text-align: center;">
            --- Watermark: Generated for Org ${orgId} at ${new Date().toISOString()} ---
          </p>
        </body>
      </html>
    `;

    // Generate docx buffer
    const fileBuffer = await htmlToDocx(fullHtml, null, {
      table: { row: { cantSplit: true } },
      footer: true,
      pageNumber: true,
    });

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': 'attachment; filename="Proposal.docx"'
      }
    });
  } catch (error) {
    console.error("DOCX generation error:", error);
    return NextResponse.json({ error: 'Failed to generate DOCX' }, { status: 500 });
  }
}

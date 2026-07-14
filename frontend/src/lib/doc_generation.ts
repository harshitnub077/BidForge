import { saveAs } from "file-saver";

export const generateDocx = async (htmlContent: string, filename: string = "Proposal.docx", orgId: string = "unknown") => {
  if (typeof window === "undefined") return;
  
  try {
    const response = await fetch('/api/docx', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ htmlContent, orgId })
    });

    if (!response.ok) throw new Error("Failed to generate DOCX");

    const blob = await response.blob();
    saveAs(blob, filename);
  } catch (error) {
    console.error("DOCX Error:", error);
    alert("Could not generate DOCX file.");
  }
};

export const generatePdf = async (elementId: string, filename: string = "Proposal.pdf", orgId: string = "unknown") => {
  if (typeof window === "undefined") return;
  
  const html2pdf = (await import("html2pdf.js")).default;
  const sourceElement = document.getElementById(elementId);
  if (!sourceElement) return;

  // To bypass html2canvas crashing on Tailwind's modern oklch/lab CSS variables,
  // we clone the element into a clean, isolated iframe with only safe, basic CSS.
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  document.body.appendChild(iframe);
  
  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) {
    document.body.removeChild(iframe);
    return window.print(); // Fallback to native print
  }

  // Basic safe CSS for the PDF
  const safeCSS = `
    body { font-family: system-ui, sans-serif; color: #111; line-height: 1.6; padding: 20px; font-size: 14px; }
    h1, h2, h3 { color: #000; font-weight: 600; margin-top: 1.5em; margin-bottom: 0.75em; }
    h1 { font-size: 24px; }
    h2 { font-size: 20px; border-bottom: 1px solid #eee; padding-bottom: 4px; }
    h3 { font-size: 16px; }
    p { margin-bottom: 1em; }
    ul { margin-bottom: 1em; padding-left: 24px; }
    li { margin-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; margin: 1.5em 0; font-size: 12px; }
    th, td { padding: 8px 12px; border: 1px solid #ccc; text-align: left; }
    th { background-color: #f5f5f5; font-weight: bold; }
    .watermark { margin-top: 40px; font-size: 10px; color: #888; text-align: center; }
  `;

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <style>${safeCSS}</style>
      </head>
      <body>
        ${sourceElement.innerHTML}
        <div class="watermark">Watermark: Generated via ProposalAI (Org: ${orgId}) at ${new Date().toISOString()}</div>
      </body>
    </html>
  `);
  doc.close();

  const opt = {
    margin:       0.75,
    filename:     filename,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true, logging: false },
    jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
  };

  // Generate PDF from the isolated iframe body
  await html2pdf().set(opt).from(doc.body).save();
  
  // Cleanup
  document.body.removeChild(iframe);
};

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

  // Basic safe CSS for the PDF - Professional White Background & Black Text
  const safeCSS = `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
    
    * { box-sizing: border-box; }
    body { 
      font-family: 'Plus Jakarta Sans', system-ui, sans-serif; 
      color: #111827; /* Dark almost black text */
      background-color: #ffffff; /* Strictly white background */
      line-height: 1.6; 
      padding: 40px; 
      font-size: 14px; 
    }
    
    /* Force text inside to be dark, overriding any dark mode styles from UI */
    body * { color: #111827; }
    
    h1, h2, h3, h4 { color: #000 !important; font-weight: 700; margin-top: 1.5em; margin-bottom: 0.75em; }
    h1 { font-size: 28px; border-bottom: 2px solid #111; padding-bottom: 10px; }
    h2 { font-size: 22px; border-bottom: 1px solid #eaeaea; padding-bottom: 5px; }
    h3 { font-size: 18px; }
    p { margin-bottom: 1.2em; color: #3f3f46 !important; }
    ul, ol { margin-bottom: 1.2em; padding-left: 24px; }
    li { margin-bottom: 6px; color: #3f3f46 !important; }
    strong, b { font-weight: 600; color: #000 !important; }
    
    /* Professional Tables */
    table { width: 100%; border-collapse: collapse; margin: 2em 0; font-size: 12px; }
    th, td { padding: 12px 16px; border: 1px solid #e4e4e7 !important; text-align: left; }
    th { background-color: #f4f4f5 !important; font-weight: 600; color: #000 !important; }
    
    /* Blockquotes (for Win Score Analysis) */
    blockquote { 
      border-left: 4px solid #3b82f6 !important; 
      background-color: #eff6ff !important; 
      padding: 16px 20px; 
      margin: 1.5em 0; 
      border-radius: 0 8px 8px 0;
    }
    blockquote * { color: #1e3a8a !important; }
    
    /* Mermaid SVGs & other images */
    svg { max-width: 100%; height: auto; }
    svg text { fill: #000 !important; }
    svg path, svg line { stroke: #333 !important; }
    
    .watermark { margin-top: 60px; font-size: 10px; color: #a1a1aa !important; text-align: center; border-top: 1px solid #f4f4f5; padding-top: 20px; }
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;

  // Generate PDF from the isolated iframe body
  await html2pdf().set(opt).from(doc.body).save();
  
  // Cleanup
  document.body.removeChild(iframe);
};

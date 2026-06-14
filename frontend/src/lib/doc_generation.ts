// Note: html2pdf.js must be dynamically imported in Next.js since it relies on window
// We stub the interfaces here.

import { Document, Packer, Paragraph, TextRun } from "docx";

export const generateDocx = async (content: string, filename: string = "Proposal.docx", orgId: string = "unknown") => {
  const doc = new Document({
    creator: `ProposalAI (Org: ${orgId})`,
    title: filename,
    description: `Generated at ${new Date().toISOString()}`,
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: "ProposalAI - Generated Document",
                bold: true,
                size: 32,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: content,
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `\n\n--- Watermark: Generated for Org ${orgId} at ${new Date().toISOString()} ---`,
                size: 16,
                color: "888888"
              }),
            ],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  document.body.appendChild(a);
  a.style.display = "none";
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
};

export const generatePdf = async (elementId: string, filename: string = "Proposal.pdf", orgId: string = "unknown") => {
  if (typeof window === "undefined") return;
  
  // Dynamic import for html2pdf.js
  const html2pdf = (await import("html2pdf.js")).default;
  const element = document.getElementById(elementId);
  
  if (!element) return;

  const opt = {
    margin:       1,
    filename:     filename,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2 },
    jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
  };

  // Note: html2pdf.js does not natively support injecting complex invisible PDF metadata without hacking jsPDF.
  // We append a visible watermark to the DOM briefly before generating, or we rely on the backend.
  // For this free tier, we append a visible footer watermark.
  
  const watermark = document.createElement("div");
  watermark.style.fontSize = "10px";
  watermark.style.color = "#888";
  watermark.style.marginTop = "20px";
  watermark.style.textAlign = "center";
  watermark.innerText = `Watermark: Generated via ProposalAI (Org: ${orgId}) at ${new Date().toISOString()}`;
  element.appendChild(watermark);

  html2pdf().set(opt).from(element).save().then(() => {
    // Cleanup watermark from DOM
    element.removeChild(watermark);
  });
};

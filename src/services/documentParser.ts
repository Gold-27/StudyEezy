import pdfParse from "pdf-parse";
import mammoth from "mammoth";

/**
 * Extracts raw textual data from a PDF file buffer.
 */
export async function parsePdf(buffer: Buffer): Promise<string> {
  try {
    const data = await pdfParse(buffer);
    return data.text || "";
  } catch (error) {
    console.error("PDF parsing failed:", error);
    throw new Error("Unable to extract text from PDF document.");
  }
}

/**
 * Extracts raw textual data from a DOCX file buffer.
 */
export async function parseDocx(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || "";
  } catch (error) {
    console.error("DOCX parsing failed:", error);
    throw new Error("Unable to extract text from DOCX document.");
  }
}

/**
 * Standard router method directing document text parsing depending on extension type.
 */
export async function parseDocumentText(buffer: Buffer, fileType: "pdf" | "doc" | "docx"): Promise<string> {
  if (fileType === "pdf") {
    return parsePdf(buffer);
  } else if (fileType === "docx" || fileType === "doc") {
    return parseDocx(buffer);
  }
  return "";
}

import { createReadStream } from "fs";
import PDFParser from "pdf-parse";
import { generateContent } from "./anthropic";

export async function extractTextFromPDF(filePath: string): Promise<string> {
  try {
    const dataBuffer = await new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      const stream = createReadStream(filePath);
      stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
      stream.on("error", (err) => reject(err));
      stream.on("end", () => resolve(Buffer.concat(chunks)));
    });

    const data = await PDFParser(dataBuffer, {
      // Set options to avoid test file dependency
      max: 0, // No page limit
      version: 'default' // Skip version checks
    });
    return data.text;
  } catch (error: any) {
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
}

export async function analyzePDFContent(text: string) {
  try {
    const prompt = `Analyze the following document and provide:
1. A concise summary of the key points
2. A risk rating on a scale of 1-5 (where 1 is lowest risk and 5 is highest risk)
3. Additional important information or recommendations

Format your response as a JSON object with the following structure:
{
  "summary": "string",
  "riskRating": number,
  "additionalInfo": ["string"]
}

Here's the document text:
${text}`;

    const response = await generateContent("financial_analysis", "PDF Document Analysis", prompt);
    return JSON.parse(response);
  } catch (error: any) {
    throw new Error(`Failed to analyze PDF content: ${error.message}`);
  }
}
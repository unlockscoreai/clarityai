
'use server';

/**
 * @fileOverview Credit report analyzer flow.
 *
 * - analyzeCreditReport - Analyzes a credit report PDF to identify errors, negative accounts, and improvement opportunities.
 * - AnalyzeCreditReportInput - The input type for the analyzeCreditReport function.
 * - AnalyzeCreditReportOutput - The return type for the analyzeCreditReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import pdf from 'pdf-parse';


// #region Input and Output Schemas
export const AnalyzeCreditReportInputSchema = z.object({
  fileData: z.array(z.number()).describe("The raw byte data of the PDF file."),
  fileName: z.string().describe("The name of the uploaded file."),
});
export type AnalyzeCreditReportInput = z.infer<typeof AnalyzeCreditReportInputSchema>;

export const AnalyzeCreditReportOutputSchema = z.object({
  summary: z.string().describe("A brief summary of the credit report's overall health."),
  creditScore: z.number().describe("The primary credit score found in the report."),
  tradelinesFound: z.number().describe("The total number of tradelines (accounts) found."),
  inquiriesFound: z.number().describe("The total number of hard inquiries found."),
  negativeItems: z.array(
    z.object({
      type: z.string().describe("The type of negative item (e.g., 'Collection', 'Late Payment')."),
      date: z.string().describe("The date associated with the negative item."),
      account: z.string().describe("The name of the account or creditor associated with the item."),
    })
  ).describe("A list of negative or derogatory items found in the report."),
});
export type AnalyzeCreditReportOutput = z.infer<typeof AnalyzeCreditReportOutputSchema>;
// #endregion

const SYSTEM_PROMPT = `
You are a credit report analyzer.
Extract key structured details from the uploaded credit report.
Always return valid JSON strictly matching the schema.
`;

export async function analyzeCreditReport(input: AnalyzeCreditReportInput): Promise<AnalyzeCreditReportOutput> {
  return analyzeCreditReportFlow(input);
}

/**
 * Extracts text from a PDF buffer, with validation.
 * @param pdfBuffer The PDF file content as a Buffer.
 * @returns A promise that resolves with the extracted text content.
 */
async function extractPdfText(pdfBuffer: Buffer): Promise<string> {
    if (!pdfBuffer || pdfBuffer.length === 0) {
        throw new Error('Uploaded PDF file is empty or invalid.');
    }
    const data = await pdf(pdfBuffer);
    return data.text;
}


const analyzeCreditReportFlow = ai.defineFlow(
  {
    name: 'analyzeCreditReportFlow',
    inputSchema: AnalyzeCreditReportInputSchema,
    outputSchema: AnalyzeCreditReportOutputSchema,
  },
  async (input) => {
    // 1) Convert bytes -> text, with validation
    const buffer = Buffer.from(input.fileData);
    const reportText = await extractPdfText(buffer);

    // 2) Ask the model
    const llmResponse = await ai.generate({
      prompt: `Analyze this credit report (filename: ${input.fileName}). The report text is as follows:\n\n${reportText}`,
      model: 'googleai/gemini-1.5-flash',
      output: {
        format: 'json',
        schema: AnalyzeCreditReportOutputSchema,
      },
      system: SYSTEM_PROMPT,
      temperature: 0,
    });

    const output = llmResponse.output();

    if (!output) {
        console.error("AI returned no output.");
        throw new Error("Analysis failed: AI returned no output.");
    }
    
    // Use Zod safeParse to validate the output against the schema.
    const result = AnalyzeCreditReportOutputSchema.safeParse(output);
    if (!result.success) {
      console.error("Schema validation failed:", result.error.format());
      throw new Error("Analysis failed: AI returned data in an invalid format.");
    }

    return result.data;
  }
);

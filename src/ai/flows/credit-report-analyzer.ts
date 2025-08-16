
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
import { pdfTextExtractor } from "@/lib/pdfTextExtractor";


// #region Input and Output Schemas
export const AnalyzeCreditReportInputSchema = z.object({
  fileData: z.array(z.number()),
  fileName: z.string(),
});
export type AnalyzeCreditReportInput = z.infer<typeof AnalyzeCreditReportInputSchema>;

export const AnalyzeCreditReportOutputSchema = z.object({
  summary: z.string().describe("A brief summary of the credit report's overall health."),
  creditScore: z.number().describe("The primary credit score found in the report.").default(0),
  tradelinesFound: z.number().describe("The total number of tradelines (accounts) found.").default(0),
  inquiriesFound: z.number().describe("The total number of hard inquiries found.").default(0),
  negativeItems: z.array(
    z.object({
      type: z.string().describe("The type of negative item (e.g., 'Collection', 'Late Payment')."),
      date: z.string().describe("The date associated with the negative item."),
      account: z.string().describe("The name of the account or creditor associated with the item."),
    })
  ).describe("A list of negative or derogatory items found in the report.").default([]),
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

const analyzeCreditReportFlow = ai.defineFlow(
  {
    name: 'analyzeCreditReportFlow',
    inputSchema: AnalyzeCreditReportInputSchema,
    outputSchema: AnalyzeCreditReportOutputSchema,
  },
  async (input) => {
    // 1) Convert bytes -> text
    const buffer = Buffer.from(input.fileData);
    const reportText = await pdfTextExtractor(buffer);

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
        return AnalyzeCreditReportOutputSchema.parse({});
    }
    
    // Use Zod safeParse to validate and apply defaults if needed
    const result = AnalyzeCreditReportOutputSchema.safeParse(output);
    if (!result.success) {
      console.warn("Schema validation failed, applying defaults:", result.error.format());
      return AnalyzeCreditReportOutputSchema.parse({}); // fallback to defaults
    }

    return result.data;
  }
);

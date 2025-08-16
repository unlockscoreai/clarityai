
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
  derogatoryCount: z.number().describe('The total number of derogatory items found in the report.').default(0),
  openAccounts: z.number().describe('The total number of open accounts.').default(0),
  inquiryCount: z.number().describe('The total number of hard inquiries in the last 12 months.').default(0),
  totalAccounts: z.number().describe('The total number of accounts (open and closed).').default(0),
  challengeItems: z.array(z.object({
    name: z.string().describe('The name of the creditor and account for the disputed item. e.g., "ABC Collections - Acct ••1234"').default(''),
    reason: z.string().describe('A brief reason why this item is being challenged.').default(''),
    successChance: z.number().describe('An estimated success chance percentage for disputing this item (0-100).').default(0),
  })).describe('A list of items recommended for dispute.').default([]),
   actionPlan: z.array(z.string()).describe('A personalized, step-by-step action plan for credit improvement.').default([]),
});
export type AnalyzeCreditReportOutput = z.infer<typeof AnalyzeCreditReportOutputSchema>;
// #endregion

const SYSTEM_PROMPT = `
You are an AI credit report analyst. Your goal is to analyze the provided credit report text and return a valid JSON object with specific metrics and actionable advice.

Your response MUST be a valid JSON object that conforms to the provided schema. Do not include any text, markdown, or code fences before or after the JSON object.

Based on the credit report text, provide the following:
- derogatoryCount: Count of all negative items (collections, charge-offs, public records, late payments).
- openAccounts: Count of all currently open accounts.
- inquiryCount: Count of all hard inquiries listed.
- totalAccounts: The total number of accounts, both open and closed.
- challengeItems: An array of items recommended for dispute. For each, provide the creditor's name, the reason for the dispute (e.g., "Unverified account", "Incorrect balance"), and an estimated success chance (0-100).
- actionPlan: A list of 3-5 clear, concise, and actionable steps to improve the credit score (e.g., "Pay down credit card X to below 30% utilization.").
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
    const prompt = `${SYSTEM_PROMPT}\n\nCREDIT REPORT TEXT:\n${reportText}\n`;
    const llmResponse = await ai.generate({
      prompt,
      temperature: 0.2,
      model: 'googleai/gemini-1.5-flash',
      output: {
        format: 'json',
        schema: AnalyzeCreditReportOutputSchema,
      },
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

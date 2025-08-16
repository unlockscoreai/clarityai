
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
You are an AI credit report analyst.

Goal:
Return a strictly valid JSON object with summary metrics and recommended dispute targets.

Count metrics using the provided credit report text:
- derogatoryCount: number of negative items (collections, charge-offs, public records, 30/60/90+ day lates still reporting)
- openAccounts: number of currently open/active accounts
- inquiryCount: number of hard inquiries in the last 24 months (if range unclear, count all hard inquiries listed)
- totalAccounts: total accounts including closed

Build challengeItems:
For each derogatory or questionable entry, add an item with:
- name: creditor/collector + last 4 of the account if present
- reason: concise dispute basis (e.g., "Unverified account", "Incorrect balance/DOFD", "Not mine", "Paid but still reporting")
- successChance: integer from 0 to 100 estimating removal/correction likelihood

Build actionPlan:
Create 3–6 clear steps that would measurably improve the score (e.g., paydown amounts to reach <30% utilization, remove authorized user risks, add credit-builder loan, stop new applications, goodwill requests, etc.). Keep each step one sentence.

STRICT OUTPUT FORMAT (must be VALID JSON, no extra text):
{
  "derogatoryCount": number,
  "openAccounts": number,
  "inquiryCount": number,
  "totalAccounts": number,
  "challengeItems": [
    { "name": string, "reason": string, "successChance": number }
  ],
  "actionPlan": [string, ...]
}
`;

/**
 * Helper: try to coerce the model output into JSON if it wraps it with text.
 */
function extractJsonBlock(text: string): string {
  // Strip code fences like ```json ... ```
  text = text.replace(/```(?:json)?/gi, "").trim();

  // Find the first {...} block
  const match = text.match(/\{[\s\S]*\}/m);
  if (match) return match[0];

  // Fall back to raw text
  return text;
}


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
    const {text} = await ai.generate({
      prompt,
      temperature: 0.2,
    });

    if (!text) {
        // Fallback to defaults if AI returns nothing
        return AnalyzeCreditReportOutputSchema.parse({});
    }

    // 3) Parse JSON strictly
    let raw = extractJsonBlock(text);

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      console.error("AI returned invalid JSON: " + raw);
      // Fallback to defaults if JSON is malformed
      return AnalyzeCreditReportOutputSchema.parse({});
    }

    // Use Zod safeParse to avoid hard crash and apply defaults
    const result = AnalyzeCreditReportOutputSchema.safeParse(parsed);
    if (!result.success) {
      console.warn("Schema validation failed, applying defaults:", result.error.format());
      return AnalyzeCreditReportOutputSchema.parse({}); // fallback to defaults
    }

    return result.data;
  }
);

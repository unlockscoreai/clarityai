
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

// #region Input and Output Schemas
const AnalyzeCreditReportInputSchema = z.object({
  creditReportDataUri: z
    .string()
    .describe(
      "A credit report PDF, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AnalyzeCreditReportInput = z.infer<typeof AnalyzeCreditReportInputSchema>;

const AnalyzeCreditReportOutputSchema = z.object({
  summary: z.string().describe("A brief summary of the credit report's overall health."),
  derogatoryCount: z.number().describe('The total number of derogatory items found in the report.'),
  openAccounts: z.number().describe('The total number of open accounts.'),
  inquiryCount: z.number().describe('The total number of hard inquiries in the last 12 months.'),
  totalAccounts: z.number().describe('The total number of accounts (open and closed).'),
  challengeItems: z.array(z.object({
    creditor: z.string().describe('The name of the creditor for the disputed item.'),
    accountNumber: z.string().describe('The account number of the disputed item (last 4 digits).'),
    reason: z.string().describe('A brief reason why this item is being challenged.'),
    successChance: z.number().describe('An estimated success chance percentage for disputing this item (0-100).'),
  })).describe('A list of items recommended for dispute.'),
   actionPlan: z.array(z.string()).describe('A personalized, step-by-step action plan for credit improvement.'),
});
export type AnalyzeCreditReportOutput = z.infer<typeof AnalyzeCreditReportOutputSchema>;
// #endregion

export async function analyzeCreditReport(input: AnalyzeCreditReportInput): Promise<AnalyzeCreditReportOutput> {
  return analyzeCreditReportFlow(input);
}

const analysisPrompt = ai.definePrompt({
  name: 'creditAnalysisPrompt',
  input: {schema: AnalyzeCreditReportInputSchema},
  output: {schema: AnalyzeCreditReportOutputSchema},
  prompt: `
  You are an AI credit report analyzer.

  Instructions:

  1. Summarize: Provide a brief summary of the credit report's overall health.
  
  2. Count Metrics:
     - derogatoryCount: Count all derogatory items (collections, charge-offs, late payments, public records).
     - openAccounts: Count all currently open accounts.
     - inquiryCount: Count all hard inquiries (ideally within the last 12-24 months).
     - totalAccounts: Count all accounts, both open and closed.

  3. Recommended Disputes:
     - For each derogatory item, generate a dispute recommendation.
     - Include: creditor name, account number (last 4 digits), reason for dispute, and estimated successChance (0-100).

  4. Create an Action Plan:
     - Generate a actionPlan with 3-5 clear, prioritized, and actionable steps the user can take to improve their credit.

  Credit Report Document:
  {{media url=creditReportDataUri}}

  Respond ONLY with valid JSON following the defined output schema.
  `,
});

const analyzeCreditReportFlow = ai.defineFlow(
  {
    name: 'analyzeCreditReportFlow',
    inputSchema: AnalyzeCreditReportInputSchema,
    outputSchema: AnalyzeCreditReportOutputSchema,
  },
  async input => {
    const { output } = await analysisPrompt(input);
    if (!output) {
        throw new Error("Failed to parse the credit report.");
    }
    return output;
  }
);

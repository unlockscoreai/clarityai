
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
  derogatoryCount: z.number().describe('The total number of derogatory items found in the report.'),
  openAccounts: z.number().describe('The total number of open accounts.'),
  inquiryCount: z.number().describe('The total number of hard inquiries in the last 12 months.'),
  totalAccounts: z.number().describe('The total number of accounts (open and closed).'),
  challengeItems: z.array(z.object({
    name: z.string().describe('The name of the item to challenge (e.g., creditor name and partial account number).'),
    reason: z.string().describe('A brief reason why this item is being challenged.'),
    successChance: z.number().describe('An estimated success chance percentage for disputing this item.'),
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
  You are an expert credit analyst. Analyze the provided credit report and extract the specified information into the required JSON format.

  Credit Report Document:
  {{media url=creditReportDataUri}}

  **Instructions:**
  1.  **Count Metrics:**
      *   derogatoryCount: Count all derogatory items (e.g., collections, charge-offs, late payments, public records).
      *   openAccounts: Count all currently open accounts.
      *   inquiryCount: Count all hard inquiries, ideally within the last 12-24 months.
      *   totalAccounts: Count all accounts, both open and closed.

  2.  **Identify Challengeable Items:**
      *   Create a list of challengeItems.
      *   For each item, provide a name (e.g., "ABC Collections - Acct #...1234"), a concise reason for the dispute (e.g., "Balance mismatch", "Unrecognized account"), and estimate a successChance as a percentage (e.g., 75).
      *   Prioritize items that are factually incorrect, old, or from third-party collectors.

  3.  **Create an Action Plan:**
      *   Generate a actionPlan with 3-5 clear, prioritized, and actionable steps the user can take to improve their credit.
      *   The first steps should focus on the identified challengeItems.
      *   Subsequent steps can include general advice like paying down high-utilization cards or avoiding new credit.

  Provide only the JSON output conforming to the schema.
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

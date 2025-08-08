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

const AnalyzeCreditReportInputSchema = z.object({
  creditReportDataUri: z
    .string()
    .describe(
      "A credit report PDF, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AnalyzeCreditReportInput = z.infer<typeof AnalyzeCreditReportInputSchema>;

const AnalyzeCreditReportOutputSchema = z.object({
  analysisSummary: z.string().describe('A summary of the credit report analysis.'),
  errorsIdentified: z.array(z.string()).describe('A list of errors identified in the credit report.'),
  negativeAccounts: z.array(z.string()).describe('A list of negative accounts found in the credit report.'),
  improvementOpportunities: z.array(z.string()).describe('A list of improvement opportunities for the credit report.'),
});
export type AnalyzeCreditReportOutput = z.infer<typeof AnalyzeCreditReportOutputSchema>;

export async function analyzeCreditReport(input: AnalyzeCreditReportInput): Promise<AnalyzeCreditReportOutput> {
  return analyzeCreditReportFlow(input);
}

const analyzeCreditReportPrompt = ai.definePrompt({
  name: 'analyzeCreditReportPrompt',
  input: {schema: AnalyzeCreditReportInputSchema},
  output: {schema: AnalyzeCreditReportOutputSchema},
  prompt: `You are an expert credit analyst. Analyze the following credit report and identify errors, negative accounts, and improvement opportunities.

Credit Report:
{{media url=creditReportDataUri}}

Analysis Summary:
Errors Identified:
Negative Accounts:
Improvement Opportunities:`, // Provide initial structure for the output
});

const analyzeCreditReportFlow = ai.defineFlow(
  {
    name: 'analyzeCreditReportFlow',
    inputSchema: AnalyzeCreditReportInputSchema,
    outputSchema: AnalyzeCreditReportOutputSchema,
  },
  async input => {
    const {output} = await analyzeCreditReportPrompt(input);
    return output!;
  }
);

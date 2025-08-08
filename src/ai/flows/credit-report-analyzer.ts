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
  personal: z.object({
    fullName: z.string().describe('Full name of the person on the report.'),
    dob: z.string().describe('Date of birth in YYYY-MM-DD format.'),
    address: z.string().describe('Current address.'),
  }),
  score: z.object({
    equifax: z.number().describe('Equifax credit score.'),
    experian: z.number().describe('Experian credit score.'),
    transunion: z.number().describe('TransUnion credit score.'),
    mergedScore: z.number().describe('A merged or average credit score.'),
  }),
  accounts: z.array(z.object({
    accountId: z.string().describe('Unique identifier for the account.'),
    type: z.enum(['revolving', 'installment', 'mortgage', 'other']).describe('Type of credit account.'),
    status: z.enum(['open', 'closed', 'charged_off', 'collection', 'paid']).describe('Current status of the account.'),
    balance: z.number().describe('Current account balance.'),
    creditLimit: z.number().describe('The credit limit for the account.'),
    dateOpened: z.string().describe('Date the account was opened in YYYY-MM-DD format.'),
    lastReportedDate: z.string().describe('Date the account was last reported in YYYY-MM-DD format.'),
    paymentHistory: z.object({
      monthsReported: z.number().describe('Number of months the payment history covers.'),
      late30: z.number().describe('Number of 30-day late payments.'),
      late60: z.number().describe('Number of 60-day late payments.'),
      late90: z.number().describe('Number of 90+ day late payments.'),
    }),
  })),
  publicRecords: z.array(z.object({
    type: z.enum(['bankruptcy', 'lien', 'judgment']).describe('Type of public record.'),
    date: z.string().describe('Date of the public record in YYYY-MM-DD format.'),
    status: z.enum(['open', 'satisfied']).describe('Status of the public record.'),
  })),
  inquiries: z.array(z.object({
    date: z.string().describe('Date of the inquiry in YYYY-MM-DD format.'),
    type: z.enum(['hard', 'soft']).describe('Type of inquiry.'),
    source: z.string().describe('The source or creditor for the inquiry.'),
  })),
  collections: z.array(z.object({
    accountId: z.string().describe('Identifier for the collection account.'),
    balance: z.number().describe('The balance of the collection account.'),
    status: z.enum(['open', 'paid']).describe('Status of the collection account.'),
  })),
  rawText: z.string().optional().describe('Full extracted text of the report.'),
});
export type AnalyzeCreditReportOutput = z.infer<typeof AnalyzeCreditReportOutputSchema>;

export async function analyzeCreditReport(input: AnalyzeCreditReportInput): Promise<AnalyzeCreditReportOutput> {
  return analyzeCreditReportFlow(input);
}

const analyzeCreditReportPrompt = ai.definePrompt({
  name: 'analyzeCreditReportPrompt',
  input: {schema: AnalyzeCreditReportInputSchema},
  output: {schema: AnalyzeCreditReportOutputSchema},
  prompt: `You are an expert credit analyst. Analyze the following credit report and extract the user's personal information, credit scores, account details, public records, inquiries, and collection accounts into the specified JSON format.

Credit Report:
{{media url=creditReportDataUri}}

Extract all available information according to the provided JSON schema.
`,
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

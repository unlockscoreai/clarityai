'use server';
/**
 * @fileOverview Enhanced credit report analysis flow for Unlock Score.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// ------------------------------
// Input / Output Schemas
// ------------------------------

const AnalyzeCreditProfileInputSchema = z.object({
  creditReportGsUri: z
    .string()
    .describe(
      "A credit report file as a Google Cloud Storage URI. Format: 'gs://<bucket>/<path-to-file>'"
    ),
});

export type AnalyzeCreditProfileInput = z.infer<typeof AnalyzeCreditProfileInputSchema>;

const DisputableItemSchema = z.object({
  item: z.string().describe('The disputable item name'),
  reason: z.string().describe('Reason it may be disputable'),
  successProbability: z
    .number()
    .min(0)
    .max(100)
    .describe('Estimated probability of successful removal'),
});

const AnalyzeCreditProfileOutputSchema = z.object({
  summary: z.string().describe('Brief credit profile overview'),
  actionItems: z.array(z.string()).describe('Concrete steps to improve credit'),
  disputableItems: z.array(DisputableItemSchema).describe(
    'Items likely disputable with reasons and success probability'
  ),
  unlockScoreProgress: z
    .number()
    .min(0)
    .max(100)
    .describe('Estimated % toward a high Unlock Score based on checklist')
});

export type AnalyzeCreditProfileOutput = z.infer<typeof AnalyzeCreditProfileOutputSchema>;

// ------------------------------
// Checklist
// ------------------------------

const checklist = `
Credit Profile Checklist for a High Unlock Score:

A. Personal Credit (FICO)
- 700+ FICO score
- No late payments in past 24 months
- Utilization < 10%
- At least 2 primary revolving accounts
- $5K+ limit on at least one primary
- Credit history >= 2 years
- 1-2 installment accounts with >=12 months payment history
- <3 inquiries in last 6 months
- Less than 1 AU tradeline

B. Business Credit (if applicable)
- EIN + Business bank account
- At least 3 net-30 vendor accounts
- Business credit score (D&B, Experian) established
- Monthly revenue: $10K+ (for funding)
- Clean 3-6 months of business bank statements
- No recent overdrafts or negative days

C. Supporting Docs
- Driver’s license
- Proof of address
- 2 months of paystubs or income
- Business incorporation docs (if applying for biz credit)
`;

// ------------------------------
// AI Prompt
// ------------------------------

const analyzeCreditProfilePrompt = ai.definePrompt({
  name: 'analyzeCreditProfilePrompt',
  input: { schema: AnalyzeCreditProfileInputSchema },
  output: { schema: AnalyzeCreditProfileOutputSchema },
  prompt: `
You are a professional credit analyst. Analyze the credit report and generate:

1. Summary of the credit profile.
2. Specific, actionable Action Items to meet checklist criteria.
3. Disputable items with item name, reason, and success probability.

Checklist for reference:
${checklist}

Credit Report: {{media url=creditReportGsUri}}

Instructions:
- Compare profile against checklist.
- Provide Unlock Score progress (% completion of checklist).
- Output strictly in the JSON format defined.
`
});

// ------------------------------
// Analysis Flow
// ------------------------------

const analyzeCreditProfileFlow = ai.defineFlow(
  {
    name: 'analyzeCreditProfileFlow',
    inputSchema: AnalyzeCreditProfileInputSchema,
    outputSchema: AnalyzeCreditProfileOutputSchema
  },
  async (input) => {
    const { output } = await analyzeCreditProfilePrompt(input);
    if (!output) {
      throw new Error('AI failed to produce analysis output.');
    }

    // Optional: Compute Unlock Score Progress (simple heuristic)
    const progress = Math.min(
      100,
      Math.max(
        0,
        Math.round((output.actionItems.length ? 100 - output.actionItems.length * 10 : 100))
      )
    );
    
    // The prompt doesn't consistently return this, so we compute it here.
    if ('unlockScoreProgress' in output) {
        delete (output as any).unlockScoreProgress;
    }

    return { ...output, unlockScoreProgress: progress };
  }
);


export async function analyzeCreditProfile(
  input: AnalyzeCreditProfileInput
): Promise<AnalyzeCreditProfileOutput> {
  if (!input.creditReportGsUri.startsWith('gs://')) {
    throw new Error('Invalid credit report URI. Must be a gs:// URI.');
  }

  return analyzeCreditProfileFlow(input);
}

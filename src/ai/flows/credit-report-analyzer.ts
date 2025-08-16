
'use server';
/**
 * @fileOverview Analyzes a credit report against a checklist for a high Unlock Score.
 */

import { z } from 'genkit';
import pdf from 'pdf-parse';
import { ai } from '@/ai/genkit';
import { run } from 'genkit';

const AnalyzeCreditProfileInputSchema = z.object({
  creditReportDataUri: z
    .string()
    .describe(
      "A credit report file as a data URI that must include a MIME type and use Base64 encoding. Format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AnalyzeCreditProfileInput = z.infer<typeof AnalyzeCreditProfileInputSchema>;

const AnalyzeCreditProfileOutputSchema = z.object({
  summary: z.string().describe('A brief summary of the credit profile analysis.'),
  actionItems: z.array(z.string()).describe('A list of personalized action items to improve the credit profile.'),
  disputableItems: z.array(
    z.object({
      item: z.string().describe('The name of the disputable item from the report.'),
      reason: z.string().describe('Why this item is likely disputable.'),
      successProbability: z.number().min(0).max(100).describe('Estimated chance of successful removal, as a percentage.'),
    })
  ).describe('Items identified as potentially disputable, with success probability.'),
});
export type AnalyzeCreditProfileOutput = z.infer<typeof AnalyzeCreditProfileOutputSchema>;

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

C. Supporting Docs for Underwriting
- Driver’s license
- Proof of address
- 2 months of paystubs or income
- Business incorporation docs (if applying for biz credit)
`;

// Helper: Convert data URI to buffer
function dataUriToBuffer(dataUri: string): Buffer {
  const matches = dataUri.match(/^data:.+;base64,(.+)$/);
  if (!matches || !matches[1]) throw new Error('Invalid credit report data URI.');
  return Buffer.from(matches[1], 'base64');
}

// Helper: Extract text from PDF
async function extractPdfText(dataUri: string) {
  const buffer = dataUriToBuffer(dataUri);
  if (buffer.length === 0) throw new Error('Credit report PDF is empty.');
  const { text } = await pdf(buffer);
  return text;
}


const analyzeCreditProfileFlow = ai.defineFlow(
  {
    name: 'analyzeCreditProfileFlow',
    inputSchema: AnalyzeCreditProfileInputSchema,
    outputSchema: AnalyzeCreditProfileOutputSchema,
  },
  async (input) => {
    const reportText = await run('extract-text', () => extractPdfText(input.creditReportDataUri));

    const prompt = `
You are a professional credit analyst. Analyze the provided credit report, generate a summary and action plan, and identify potentially disputable items.

Checklist for a strong credit profile:
${checklist}

Analyze this credit report text:
---
${reportText}
---

Instructions:
1. Parse key metrics: FICO, payment history, utilization, accounts, credit history length, inquiries.
2. Compare against checklist.
3. Summary: short overview.
4. Action Items: concrete, actionable steps.
5. Disputable Items: for each negative item, provide:
   - item
   - reason
   - successProbability (0-100)
Output in JSON format matching the schema.
`;
    const llmResponse = await ai.generate({
        prompt: prompt,
        model: 'googleai/gemini-1.5-flash',
        output: {
            format: 'json',
            schema: AnalyzeCreditProfileOutputSchema,
        },
        temperature: 0.1
    });

    const output = llmResponse.output();
    if (!output) throw new Error('AI failed to produce analysis output.');
    
    return output;
  }
);


export async function analyzeCreditProfile(
  input: AnalyzeCreditProfileInput
): Promise<AnalyzeCreditProfileOutput> {
  return analyzeCreditProfileFlow(input);
}

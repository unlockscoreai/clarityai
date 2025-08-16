'use server';
/**
 * @fileOverview Analyzes a credit report against a checklist for a high Unlock Score.
 */

import { z } from 'genkit';
import { ai } from '@/ai/genkit';

const AnalyzeCreditProfileInputSchema = z.object({
  creditReportGsUri: z
    .string()
    .describe(
      "The Google Cloud Storage URI of the credit report file. Format: 'gs://<bucket_name>/<path_to_file>'."
    ),
});
export type AnalyzeCreditProfileInput = z.infer<typeof AnalyzeCreditProfileInputSchema>;

const AnalyzeCreditProfileOutputSchema = z.object({
  summary: z.string().describe('A brief, encouraging summary of the credit profile.'),
  factors: z.array(z.object({
    title: z.string().describe('The name of the credit factor (e.g., "Payment History").'),
    description: z.string().describe('A description of the user\'s status for this factor.'),
    impact: z.string().describe('The potential score impact or advice related to this factor (e.g., "+20 points if reduced below 30%").'),
  })).describe('A breakdown of the analysis by credit factor.'),
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


const analyzeCreditProfilePrompt = ai.definePrompt({
    name: 'analyzeCreditProfilePrompt',
    input: { schema: AnalyzeCreditProfileInputSchema },
    output: { schema: AnalyzeCreditProfileOutputSchema },
    prompt: `You are a professional credit analyst with an encouraging and optimistic tone. Your goal is to empower the user to improve their credit. Analyze the provided credit report PDF and generate a detailed analysis.

Checklist for a strong credit profile:
${checklist}

Analyze this credit report:
---
{{media url=creditReportGsUri}}
---

Instructions:
1.  Directly analyze the provided PDF. Parse key metrics.
2.  Write a concise, encouraging **Summary** of the overall credit profile, highlighting strengths and opportunities.
3.  Create a **Breakdown by Credit Factor**. For each of the 5 main factors (Payment History, Credit Utilization, Credit Mix, Hard Inquiries, Age of Accounts), provide:
    -   \`title\`: The name of the factor.
    -   \`description\`: A clear, simple explanation of the user's status for this factor.
    -   \`impact\`: A tangible potential score improvement or a clear statement on its effect (e.g., "+20 points if reduced below 30%", "Score impact will decrease over 6-12 months").
4.  Create a list of concrete, actionable **Action Items** the user can take.
5.  Identify all negative or potentially incorrect items for the **Disputable Items** list. For each, provide:
    -   \`item\`: The name of the account or item.
    -   \`reason\`: A clear, professional reason for the dispute.
    -   \`successProbability\`: Your expert estimate of the chance of successful removal (0-100).

Your entire output must be in JSON format that strictly adheres to the defined schema.
`,
});


const analyzeCreditProfileFlow = ai.defineFlow(
  {
    name: 'analyzeCreditProfileFlow',
    inputSchema: AnalyzeCreditProfileInputSchema,
    outputSchema: AnalyzeCreditProfileOutputSchema,
  },
  async (input) => {
    const { output } = await analyzeCreditProfilePrompt(input);
    if (!output) throw new Error('AI failed to produce analysis output.');
    return output;
  }
);


export async function analyzeCreditProfile(
  input: AnalyzeCreditProfileInput
): Promise<AnalyzeCreditProfileOutput> {
  return analyzeCreditProfileFlow(input);
}

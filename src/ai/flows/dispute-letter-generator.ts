
'use server';

/**
 * @fileOverview Generates personalized dispute letters based on credit analysis and dispute reasons.
 *
 * - generateDisputeLetter - A function that generates the dispute letter.
 * - GenerateDisputeLetterInput - The input type for the generateDisputeLetter function.
 * - GenerateDisputeLetterOutput - The return type for the generateDisputeLetter function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateDisputeLetterInputSchema = z.object({
  fullName: z.string().describe('The full name of the person on the report.'),
  dob: z.string().describe('Date of birth in YYYY-MM-DD format.'),
  address: z.string().describe('Current address.'),
  creditBureau: z.enum(['Equifax', 'Experian', 'TransUnion']).describe('The credit bureau to send the letter to.'),
  disputedItem: z.object({
      accountNumber: z.string().describe('The account number of the disputed item.'),
      creditor: z.string().describe('The name of the creditor for the disputed item.'),
  }),
  disputeReasons: z.array(z.string()).describe('A list of reasons for the dispute.'),
});
export type GenerateDisputeLetterInput = z.infer<typeof GenerateDisputeLetterInputSchema>;

const GenerateDisputeLetterOutputSchema = z.object({
  letterContent: z.string().describe('The generated dispute letter content in plain text format.'),
});
export type GenerateDisputeLetterOutput = z.infer<typeof GenerateDisputeLetterOutputSchema>;

export async function generateDisputeLetter(input: GenerateDisputeLetterInput): Promise<GenerateDisputeLetterOutput> {
  return generateDisputeLetterFlow(input);
}

const disputeLetterPrompt = ai.definePrompt({
  name: 'disputeLetterPrompt',
  input: {schema: GenerateDisputeLetterInputSchema},
  output: {schema: GenerateDisputeLetterOutputSchema},
  prompt: `
  You are an expert in writing legally compliant and effective credit dispute letters under the Fair Credit Reporting Act (FCRA).

  Generate a professional and formal dispute letter based on the provided JSON data. The letter should be addressed to the specified credit bureau.

  **Instructions:**
  1.  **Use today's date.**
  2.  **Include all personal identification information** provided in the input JSON: Full Name, Date of Birth, and Address.
  3.  **Address the letter to the correct credit bureau** with its full name and address.
      *   **Equifax:** Equifax Information Services LLC, P.O. Box 740256, Atlanta, GA 30374
      *   **Experian:** Experian, P.O. Box 4500, Allen, TX 75013
      *   **TransUnion:** TransUnion LLC Consumer Dispute Center, P.O. Box 2000, Chester, PA 19016
  4.  **Reference the disputed account** clearly by name (creditor) and account number.
  5.  **State the reason for the dispute.** Clearly explain that the item is inaccurate and being challenged. Incorporate the specific dispute reasons from the input.
  6.  **Formally request an investigation and deletion.** Cite the FCRA requirement for the bureau to investigate and remove unverified or inaccurate information within 30 days.
  7.  **Include a closing statement** requesting a copy of the investigation results and an updated copy of the credit report.
  8.  **The closing should be "Sincerely," followed by the user's full name.**
  9.  **Add an "Enclosures" section** at the bottom, listing "Copy of Driver's License" and "Copy of Utility Bill" as proof of identity and address.

  **Do not invent any information.** Use only the data provided in the input.
  **The entire output must be plain text, not Markdown.**

  **Input Data:**
  \`\`\`json
  {{{json this}}}
  \`\`\`

  Output the complete letter content in plain text format.
  `,
});


const generateDisputeLetterFlow = ai.defineFlow(
  {
    name: 'generateDisputeLetterFlow',
    inputSchema: GenerateDisputeLetterInputSchema,
    outputSchema: GenerateDisputeLetterOutputSchema,
  },
  async input => {
    const {output} = await disputeLetterPrompt(input);
    return output!;
  }
);

// src/ai/flows/dispute-letter-generator.ts
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
  reportId: z.string().describe('The ID of the credit report to use.'),
  creditBureau: z.enum(['Equifax', 'Experian', 'TransUnion']).describe('The credit bureau to send the letter to.'),
  disputeReasons: z.string().describe('The reasons for the dispute.'),
});
export type GenerateDisputeLetterInput = z.infer<typeof GenerateDisputeLetterInputSchema>;

const GenerateDisputeLetterOutputSchema = z.object({
  letterContent: z.string().describe('The generated dispute letter content.'),
});
export type GenerateDisputeLetterOutput = z.infer<typeof GenerateDisputeLetterOutputSchema>;

export async function generateDisputeLetter(input: GenerateDisputeLetterInput): Promise<GenerateDisputeLetterOutput> {
  return generateDisputeLetterFlow(input);
}

const disputeLetterPrompt = ai.definePrompt({
  name: 'disputeLetterPrompt',
  input: {schema: GenerateDisputeLetterInputSchema},
  output: {schema: GenerateDisputeLetterOutputSchema},
  prompt: `You are an expert in generating credit dispute letters.

  Based on the credit report with ID: {{{reportId}}}, and the following dispute reasons: {{{disputeReasons}}},
  generate a personalized dispute letter to the credit bureau: {{{creditBureau}}}.

  The letter should clearly state the inaccuracies and request an investigation and correction.

  Ensure the letter is professional and complies with legal requirements for credit disputes.

  Output the full letter content.
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

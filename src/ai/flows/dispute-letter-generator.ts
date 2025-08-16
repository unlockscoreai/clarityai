
'use server';

/**
 * @fileOverview Generates a comprehensive package of credit dispute letters and related documents.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
export const GenerateCreditDisputeLetterInputSchema = z.object({
  creditReportDataUri: z.string().describe(
    "The user's credit report file as a data URI: 'data:<mimetype>;base64,<encoded_data>'."
  ),
  personalInformation: z.object({
      fullName: z.string().describe("The full name of the person on the report."),
      dob: z.string().describe("Date of birth in YYYY-MM-DD format."),
      address: z.string().describe("Current address."),
  }),
  additionalInstructions: z.string().optional().describe("Any additional context or instructions from the user."),
});
export type GenerateCreditDisputeLetterInput = z.infer<typeof GenerateCreditDisputeLetterInputSchema>;

export const GenerateCreditDisputeLetterOutputSchema = z.object({
  equifaxLetter: z.string().optional().describe("The generated dispute letter for Equifax."),
  experianLetter: z.string().optional().describe("The generated dispute letter for Experian."),
  transunionLetter: z.string().optional().describe("The generated dispute letter for TransUnion."),
  inquiryDisputeLetter: z.string().optional().describe("A letter specifically for disputing hard inquiries."),
  section609Request: z.string().optional().describe("A letter requesting full disclosure under Section 609 of the FCRA."),
  creditRebuildingPlan: z.string().optional().describe("A personalized plan with steps to rebuild credit after disputes."),
});
export type GenerateCreditDisputeLetterOutput = z.infer<typeof GenerateCreditDisputeLetterOutputSchema>;


const generateCreditDisputeLetterPrompt = ai.definePrompt({
  name: 'generateCreditDisputeLetterPrompt',
  input: { schema: z.object({ 
    creditReportDataUri: z.string(), 
    personalInformation: z.string(), // Pass as stringified JSON
    additionalInstructions: z.string().optional() 
  })},
  output: { schema: GenerateCreditDisputeLetterOutputSchema },
  prompt: `You are a highly skilled credit dispute specialist with deep expertise in the Fair Credit Reporting Act (FCRA). Your task is to analyze a client's credit report and personal information to generate a complete set of dispute letters and related documents.

You will receive a credit report and a JSON object with the client's personal information.

**Credit Report:**
{{media url=creditReportDataUri}}

**Client's Personal Information (JSON):**
{{{personalInformation}}}

{{#if additionalInstructions}}
**Additional Instructions from Client:**
{{{additionalInstructions}}}
{{/if}}

**Instructions:**

1.  **Analyze the Entire Credit Report:** Meticulously review the provided credit report to identify all disputable items. This includes inaccuracies, outdated information, unverifiable accounts, and unauthorized inquiries.

2.  **Generate Bureau-Specific Dispute Letters:**
    *   Create a unique, comprehensive dispute letter for each of the three major credit bureaus (Equifax, Experian, TransUnion) if negative items are present for them.
    *   Each letter must clearly list ALL disputable items found for that specific bureau, citing clear reasons for each dispute (e.g., "Not my account," "Inaccurate date," "Account is past the statute of limitations").
    *   If no negative items are found for a specific bureau, do not generate a letter for it. The corresponding output field should be omitted.
    *   **Addresses:**
        *   Equifax: Equifax Information Services LLC, P.O. Box 740256, Atlanta, GA 30374
        *   Experian: Experian, P.O. Box 4500, Allen, TX 75013
        *   TransUnion: TransUnion LLC Consumer Dispute Center, P.O. Box 2000, Chester, PA 19016

3.  **Generate Inquiry Dispute Letter:** If there are hard inquiries that could be disputed (e.g., unauthorized), generate a separate letter to challenge them. If not, omit the 'inquiryDisputeLetter' field.

4.  **Generate Section 609 Request:** Create a formal letter requesting full disclosure of all information on file under Section 609 of the FCRA. This is a powerful tool for auditing the credit file.

5.  **Create a Credit Rebuilding Plan:** Based on the analysis, provide a personalized, actionable plan for the client to rebuild their credit. Include advice on managing existing accounts, obtaining new credit responsibly, and maintaining good habits.

6.  **Formatting:**
    *   All letters must be in plain text format, professional, and legally sound.
    *   Use today's date for all letters.
    *   Include the client's full name, DOB, and address in each letter for identification.
    *   End each letter with "Sincerely," followed by the client's name.
    *   Include an "Enclosures" section at the bottom of each dispute letter, listing "Copy of Driver's License" and "Copy of Utility Bill".

Your entire output must be a single JSON object that strictly adheres to the defined output schema.
`,
});


export const generateCreditDisputeLetter = ai.defineFlow(
  {
    name: 'generateCreditDisputeLetter',
    inputSchema: GenerateCreditDisputeLetterInputSchema,
    outputSchema: GenerateCreditDisputeLetterOutputSchema,
  },
  async (input, context) => {
    const { output: letterPackage } = await generateCreditDisputeLetterPrompt({
      ...input,
      personalInformation: JSON.stringify(input.personalInformation),
    });
    if (!letterPackage) {
      throw new Error('Failed to generate letter package');
    }
    return letterPackage;
  },
);


'use server';

/**
 * @fileOverview Generates personalized dispute letters, enforces credit deduction, and saves the letter to Firestore.
 *
 * - generateDisputeLetter - A function that generates the dispute letter.
 * - GenerateDisputeLetterInput - The input type for the generateDisputeLetter function.
 * - GenerateDisputeLetterOutput - The return type for the generateDisputeLetter function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { doc, runTransaction, serverTimestamp, collection, addDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';

export const GenerateDisputeLetterInputSchema = z.object({
  fullName: z.string().describe('The full name of the person on the report.'),
  dob: z.string().describe('Date of birth in YYYY-MM-DD format.'),
  address: z.string().describe('Current address.'),
  creditBureau: z.enum(['Equifax', 'Experian', 'TransUnion']).describe('The credit bureau to send the letter to.'),
  disputedItem: z.object({
      // We no longer need account number since it's part of the name
      name: z.string().describe('The name of the creditor and account for the disputed item. e.g., "ABC Collections - Acct ••1234"'),
      reason: z.string().describe('The reason for the dispute.'),
  }),
});
export type GenerateDisputeLetterInput = z.infer<typeof GenerateDisputeLetterInputSchema>;

export const GenerateDisputeLetterOutputSchema = z.object({
  letterContent: z.string().describe('The generated dispute letter content in plain text format.'),
  letterId: z.string().describe('The ID of the newly created letter document in Firestore.'),
});
export type GenerateDisputeLetterOutput = z.infer<typeof GenerateDisputeLetterOutputSchema>;

export async function generateDisputeLetter(input: GenerateDisputeLetterInput): Promise<GenerateDisputeLetterOutput> {
  return generateDisputeLetterFlow(input);
}

const disputeLetterPrompt = ai.definePrompt({
  name: 'disputeLetterPrompt',
  input: {schema: GenerateDisputeLetterInputSchema},
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
  4.  **Reference the disputed account** clearly by its name/creditor ("{{disputedItem.name}}").
  5.  **State the reason for the dispute.** Clearly explain that the item is inaccurate and being challenged, using the provided reason: "{{disputedItem.reason}}".
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
  async (input, context) => {

    const userRef = doc(db, "users", context.auth.uid);
    const lettersCollectionRef = collection(db, "letters");

    try {
        const result = await runTransaction(db, async (transaction) => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists()) {
                throw new Error("User not found.");
            }
            const credits = userDoc.data()?.credits ?? 0;
            if (credits < 1) {
                throw new Error("Not enough credits to generate a letter.");
            }

            // 1. Deduct credit (within transaction)
            transaction.update(userRef, { credits: increment(-1) });
            
            // 2. Generate Letter Content (outside transaction if it's a long-running external call, but fine here)
            const {text: letterContent} = await ai.generate({
                prompt: (await disputeLetterPrompt.render({input})).prompt,
            });

            if (!letterContent) {
                // By throwing an error here, the transaction will automatically roll back.
                throw new Error("Failed to generate letter content. Your credit has not been charged.");
            }
            
            // 3. Store Letter in Firestore (within transaction)
            const newLetterRef = doc(lettersCollectionRef); // Create a new ref with a unique ID
            const letterData = {
                userId: context.auth.uid,
                ...input,
                letterContent,
                createdAt: serverTimestamp(),
                mailed: false, // For auto-mailer service
            };
            transaction.set(newLetterRef, letterData);

            return {
                letterContent,
                letterId: newLetterRef.id,
            };
        });

        return result;

    } catch (error: any) {
        // This will catch transaction errors, including the "Not enough credits" error.
        console.error("Dispute letter transaction failed:", error);
        // Re-throw the error so the client can handle it.
        throw new Error(error.message || "A transaction error occurred.");
    }
  }
);

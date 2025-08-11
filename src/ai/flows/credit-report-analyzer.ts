
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
import { subMonths, differenceInYears, differenceInMonths } from 'date-fns';


// #region Input and Output Schemas
const AnalyzeCreditReportInputSchema = z.object({
  fullName: z.string().describe('The full name of the user.'),
  email: z.string().email().describe('The email address of the user.'),
  creditReportDataUri: z
    .string()
    .describe(
      "A credit report PDF, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AnalyzeCreditReportInput = z.infer<typeof AnalyzeCreditReportInputSchema>;


const ParsedReportSchema = z.object({
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
    successChance: z.number().optional().describe('Success chance for disputing this item.'),
  })),
  publicRecords: z.array(z.object({
    type: z.enum(['bankruptcy', 'lien', 'judgment']).describe('Type of public record.'),
    date: z.string().describe('Date of the public record in YYYY-MM-DD format.'),
    status: z.enum(['open', 'satisfied']).describe('Status of the public record.'),
    successChance: z.number().optional().describe('Success chance for disputing this item.'),
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
    successChance: z.number().optional().describe('Success chance for disputing this item.'),
  })),
  rawText: z.string().optional().describe('Full extracted text of the report.'),
});

const DerivedTotalsSchema = z.object({
    totalDerogatoryItems: z.number(),
    totalOpenAccounts: z.number(),
    totalHardInquiriesLast12Months: z.number(),
    totalAccounts: z.number(),
    currentUtilizationPercent: z.number(),
    oldestAccountAgeYears: z.number(),
    mostRecentLateMonths: z.number().optional(),
});

const AnalysisPromptInputSchema = ParsedReportSchema.merge(DerivedTotalsSchema).merge(AnalyzeCreditReportInputSchema);

const AnalyzeCreditReportOutputSchema = z.object({
  analysisHtml: z.string().describe('The full HTML analysis of the credit report.'),
});

export type AnalyzeCreditReportOutput = z.infer<typeof AnalyzeCreditReportOutputSchema>;
// #endregion

export async function analyzeCreditReport(input: AnalyzeCreditReportInput): Promise<AnalyzeCreditReportOutput> {
  return analyzeCreditReportFlow(input);
}

// #region Prompts
const parseReportPrompt = ai.definePrompt({
  name: 'parseCreditReportPrompt',
  input: {schema: AnalyzeCreditReportInputSchema},
  output: {schema: ParsedReportSchema},
  prompt: `You are an expert credit analyst. Analyze the following credit report and extract the user's personal information, credit scores, account details, public records, inquiries, and collection accounts into the specified JSON format.

The user's name is {{fullName}} and their email is {{email}}. Use this to help resolve any ambiguities in the provided report.

Credit Report:
{{media url=creditReportDataUri}}

Extract all available information according to the provided JSON schema.
`,
});

const generateAnalysisPrompt = ai.definePrompt({
    name: 'generateAnalysisPrompt',
    input: { schema: AnalysisPromptInputSchema },
    output: { schema: AnalyzeCreditReportOutputSchema },
    system: `You are a highly professional, empathetic credit analyst assistant. Produce a clear, persuasive, data-driven personal credit analysis based on the parsed credit report data. The user's name is {{fullName}}. Output valid HTML (no external CSS) with semantic sections that can be rendered directly in a dashboard or converted to PDF.`,
    prompt: `
INSTRUCTIONS:
- Read the provided JSON data.
- Include these sections exactly: Header, Snapshot Metrics, Analysis Summary, Personalized Action Plan, Items to Challenge (detailed table), Dispute Templates Summary, Likely Impact & Timeline, Upgrade CTA.
- Use the provided derived totals: totalDerogatoryItems, totalOpenAccounts, totalHardInquiriesLast12Months, totalAccounts, currentUtilizationPercent, oldestAccountAgeYears.
- For each negative item (collections, charged-off accounts, public records with a successChance), create:
  - Short description,
  - Why it’s harmful,
  - Suggested dispute reasons (3 concise points),
  - Success chance percentage (use the provided successChance value),
  - One-line recommended next action (e.g., dispute by mail, request validation, negotiate pay-for-delete).
- Create an ordered Personalized Action Plan (3–6 steps) prioritized by impact and ease.
- Add a small data confidence note: if 'rawText' contains inconsistent names or missing sections, warn about parsing quality.
- Finish with a persuasive Upgrade CTA: list what the upgrade gives (AI-generated, personalized dispute letters, certified mailing, tracking, and affiliate/discount options). Use urgency and social proof language but do not invent metrics; use conservative phrasing like “many clients”.

Use the following JSON as input:
\`\`\`json
{{{json anaylsisInput}}}
\`\`\`

Output complete HTML based on the requested structure.
`
});
// #endregion

// #region Helper Functions
function calculateSuccessChance(item: any, type: 'account' | 'publicRecord' | 'collection'): number {
    let score = 30; // baseline

    // Modifiers can be adjusted based on more detailed logic if needed.
    // This is a simplified version based on the user's rules.
    if (type === 'publicRecord' && item.type === 'bankruptcy') {
        score -= 50;
    }
    if (type === 'account' && item.status === 'charged_off') {
        score += 10;
    }
    if (type === 'collection') {
        score += 15;
    }
    
    // Example of a more specific rule. This would require more data from the report.
    // if (item.hasMissingIdentifiers) score += 30;

    const sevenYearsAgo = subMonths(new Date(), 7 * 12);
    const itemDate = new Date(item.date || item.dateOpened);
    if (itemDate < sevenYearsAgo) {
        score += 60;
    }

    return Math.max(5, Math.min(95, score)); // Clamp between 5 and 95
}

function calculateDerivedTotals(report: z.infer<typeof ParsedReportSchema>) {
    const now = new Date();
    const oneYearAgo = subMonths(now, 12);

    const derogatoryAccounts = report.accounts.filter(a => a.status === 'charged_off' || a.status === 'collection');
    const derogatoryPublicRecords = report.publicRecords.filter(pr => pr.type === 'bankruptcy' || pr.type === 'judgment');
    const totalDerogatoryItems = derogatoryAccounts.length + report.collections.length + derogatoryPublicRecords.length;

    const totalOpenAccounts = report.accounts.filter(a => a.status === 'open').length;

    const totalHardInquiriesLast12Months = report.inquiries.filter(i => i.type === 'hard' && new Date(i.date) > oneYearAgo).length;

    const totalAccounts = report.accounts.length;

    const revolvingAccounts = report.accounts.filter(a => a.type === 'revolving' && a.status === 'open');
    const totalRevolvingBalances = revolvingAccounts.reduce((sum, a) => sum + a.balance, 0);
    const totalRevolvingLimits = revolvingAccounts.reduce((sum, a) => sum + a.creditLimit, 0);
    const currentUtilizationPercent = totalRevolvingLimits > 0 ? Math.round((totalRevolvingBalances / totalRevolvingLimits) * 100) : 0;
    
    const oldestAccount = report.accounts.reduce((oldest, current) => {
        if (!oldest) return current;
        return new Date(current.dateOpened) < new Date(oldest.dateOpened) ? current : oldest;
    }, report.accounts[0]);
    const oldestAccountAgeYears = oldestAccount ? differenceInYears(now, new Date(oldestAccount.dateOpened)) : 0;

    const allLatePayments = report.accounts.flatMap(a => {
        // This is a simplification. A real implementation would need payment history details.
        // We'll assume the last reported date is related to the last payment for now.
        const hasLates = (a.paymentHistory.late30 > 0 || a.paymentHistory.late60 > 0 || a.paymentHistory.late90 > 0);
        return hasLates ? [new Date(a.lastReportedDate)] : [];
    });
    const mostRecentLateDate = allLatePayments.length > 0 ? new Date(Math.max.apply(null, allLatePayments.map(d => d.getTime()))) : null;
    const mostRecentLateMonths = mostRecentLateDate ? differenceInMonths(now, mostRecentLateDate) : undefined;

    return {
        totalDerogatoryItems,
        totalOpenAccounts,
        totalHardInquiriesLast12Months,
        totalAccounts,
        currentUtilizationPercent,
        oldestAccountAgeYears,
        mostRecentLateMonths,
    };
}
// #endregion

const analyzeCreditReportFlow = ai.defineFlow(
  {
    name: 'analyzeCreditReportFlow',
    inputSchema: AnalyzeCreditReportInputSchema,
    outputSchema: AnalyzeCreditReportOutputSchema,
  },
  async input => {
    // 1. Parse the report PDF to get structured JSON
    const { output: parsedReport } = await parseReportPrompt(input);
    if (!parsedReport) {
        throw new Error("Failed to parse the credit report.");
    }

    // 2. Calculate derived totals
    const derivedTotals = calculateDerivedTotals(parsedReport);

    // 3. Calculate success chance for challengeable items
    parsedReport.accounts.forEach(account => {
        if (account.status === 'charged_off' || account.status === 'collection') {
            account.successChance = calculateSuccessChance(account, 'account');
        }
    });
    parsedReport.collections.forEach(collection => {
        collection.successChance = calculateSuccessChance(collection, 'collection');
    });
    parsedReport.publicRecords.forEach(record => {
        record.successChance = calculateSuccessChance(record, 'publicRecord');
    });

    // 4. Call GPT to generate the final HTML analysis
    const analysisInput = {
        ...parsedReport,
        ...derivedTotals,
        ...input,
    };
    
    const { output: analysisResult } = await generateAnalysisPrompt({ anaylsisInput: analysisInput });
    if (!analysisResult) {
        throw new Error("Failed to generate the credit analysis.");
    }

    return analysisResult;
  }
);

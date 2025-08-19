
import { config } from 'dotenv';
config();

// HACK: The dev entrypoint isn't resolving paths correctly.
import path from 'node:path';
import module from 'node:module';
const require = module.createRequire(import.meta.url);
require('tsconfig-paths/register');

import { GenerateCreditDisputeLetterInput } from '@/ai/flows/dispute-letter-generator';
import { analyzeCreditProfile } from '@/ai/flows/credit-report-analyzer';

export {
    analyzeCreditProfile,
    generateCreditDisputeLetter
};
export type { GenerateCreditDisputeLetterInput };

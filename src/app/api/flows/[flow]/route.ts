
// src/app/api/flows/[flow]/route.ts
import { createFlowsEndpoint } from '@genkit-ai/next';
import '@/ai/flows/credit-report-analyzer';
import '@/ai/flows/dispute-letter-generator';

export const { POST } = createFlowsEndpoint();

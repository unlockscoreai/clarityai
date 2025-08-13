
// src/app/api/flows/[flow]/route.ts
import { createFlowsEndpoint } from '@genkit-ai/next';
import '@/ai/dev';

export const { POST } = createFlowsEndpoint();

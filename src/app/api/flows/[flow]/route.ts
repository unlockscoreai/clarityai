
// src/app/api/flows/[flow]/route.ts
import { createFlowsEndpoint } from '@genkit-ai/next';
import '@/ai/dev';
import { auth } from '@/lib/firebase/server';

export const { POST } = createFlowsEndpoint();

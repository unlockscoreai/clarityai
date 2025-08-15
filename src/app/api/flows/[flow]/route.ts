
// src/app/api/flows/[flow]/route.ts
import { createFlowsEndpoint } from '@genkit-ai/next';
import '@/ai/dev';
import { auth } from '@/lib/firebase/server';

export const { POST } = createFlowsEndpoint({
    auth: async (token) => {
        if (!token) {
            throw new Error("Authorization token is required.");
        }
        const decodedToken = await auth.verifyIdToken(token);
        return { uid: decodedToken.uid, custom: {} };
    }
});

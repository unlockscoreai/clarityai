
'use server';

/**
 * @fileoverview A simple engine to dynamically invoke Genkit flows.
 */
import {getFlow} from 'genkit';

/**
 * Finds and executes a Genkit flow by its name.
 * @param flow The name of the flow to execute (e.g., 'analyzeCreditReportFlow').
 * @param data The input data for the flow.
 * @returns The output of the executed flow.
 */
export async function createFlowsEndpoint(flow: string, data: any, context?: any) {
  try {
    const flowToRun = getFlow(flow);
    if (!flowToRun) {
      throw new Error(`Flow "${flow}" not found.`);
    }
    const response = await flowToRun.run(data, context);
    return response;
  } catch (error: any) {
    console.error(`Error executing flow "${flow}":`, error);
    // Re-throw the error to be caught by the API route handler
    throw error;
  }
}

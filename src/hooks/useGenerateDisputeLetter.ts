
"use client";

import { useState, useCallback } from 'react';
import type { GenerateCreditDisputeLetterInput, GenerateCreditDisputeLetterOutput } from '@/ai/flows/dispute-letter-generator';
import { useToast } from './use-toast';

interface UseGenerateDisputeLetterReturn {
  generateLetter: (input: GenerateCreditDisputeLetterInput, idToken: string) => Promise<GenerateCreditDisputeLetterOutput | null>;
  loading: boolean;
  error: string | null;
  letter: GenerateCreditDisputeLetterOutput | null;
}

export function useGenerateDisputeLetter(): UseGenerateDisputeLetterReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [letter, setLetter] = useState<GenerateCreditDisputeLetterOutput | null>(null);
  const { toast } = useToast();

  const generateLetter = useCallback(async (input: GenerateCreditDisputeLetterInput, idToken: string): Promise<GenerateCreditDisputeLetterOutput | null> => {
    setLoading(true);
    setError(null);
    setLetter(null);

    try {
      const res = await fetch('/api/dispute/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify(input),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate letter package');
      }

      setLetter(data);
      toast({
        title: "Dispute Package Generated!",
        description: `Your documents have been created and 1 credit has been deducted.`,
      });
      return data;

    } catch (err: any) {
      console.error('Error generating dispute letter package:', err);
      setError(err.message || 'An unknown error occurred.');
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: err.message || "There was an error generating your documents. Please try again.",
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return { generateLetter, loading, error, letter };
}

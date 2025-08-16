
"use client";

import { useState, useCallback } from 'react';
import type { GenerateDisputeLetterInput, GenerateDisputeLetterOutput } from '@/ai/flows/dispute-letter-generator';
import { useToast } from './use-toast';

interface UseGenerateDisputeLetterReturn {
  generateLetter: (input: GenerateDisputeLetterInput, idToken: string) => Promise<GenerateDisputeLetterOutput | null>;
  loading: boolean;
  error: string | null;
  letter: GenerateDisputeLetterOutput | null;
}

export function useGenerateDisputeLetter(): UseGenerateDisputeLetterReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [letter, setLetter] = useState<GenerateDisputeLetterOutput | null>(null);
  const { toast } = useToast();

  const generateLetter = useCallback(async (input: GenerateDisputeLetterInput, idToken: string): Promise<GenerateDisputeLetterOutput | null> => {
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
        throw new Error(data.error || 'Failed to generate letter');
      }

      setLetter(data);
      toast({
        title: "Letter Generated Successfully!",
        description: `"${input.disputedItem.name}" dispute letter has been created.`,
      });
      return data;

    } catch (err: any) {
      console.error('Error generating dispute letter:', err);
      setError(err.message || 'An unknown error occurred.');
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: err.message || "There was an error generating your letter. Please try again.",
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return { generateLetter, loading, error, letter };
}


'use server';

import pdf from 'pdf-parse';

/**
 * Extracts text from a PDF buffer.
 * @param pdfBuffer The PDF file content as a Buffer.
 * @returns A promise that resolves with the extracted text content.
 */
export async function pdfTextExtractor(pdfBuffer: Buffer): Promise<string> {
  try {
    const data = await pdf(pdfBuffer);
    return data.text;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF.');
  }
}

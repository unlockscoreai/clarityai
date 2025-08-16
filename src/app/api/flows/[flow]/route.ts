
// src/app/api/flows/[flow]/route.ts
'use server';
import { NextRequest, NextResponse } from 'next/server';
import { createFlowsEndpoint } from '@/ai/flows/flow-engine'; // Assuming this is your custom flow engine wrapper
import '@/ai/dev';
import formidable from 'formidable';
import fs from 'fs';
import { auth } from '@/lib/firebase/server'; // Assuming auth is needed elsewhere or for other flows

export const config = {
  api: {
    bodyParser: false, // We handle multipart with formidable
  },
};

// Helper function to parse formidable promises
const parseForm = (req: NextRequest): Promise<{ fields: formidable.Fields; files: formidable.Files }> => {
  const form = formidable({ multiples: false, keepExtensions: true });
  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields, files });
    });
  });
};

export async function POST(
  req: NextRequest,
  { params }: { params: { flow: string } } // Access dynamic params here
) {
  const { flow } = params; // Get the flow from params

  // Only make analyzeCreditReport public
  const isPublicFlow = flow === 'analyzeCreditReport';

  if (!isPublicFlow) {
    const token = req.headers.get('authorization');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Optional: verify token here using auth if needed
    // try { await auth.verifyIdToken(token.replace('Bearer ', '')); } catch { return NextResponse.json({ error: 'Invalid token' }, { status: 401 }); }
  }

  try {
    // Check if the request is multipart/form-data (for file uploads)
    const contentType = req.headers.get('content-type');
    if (contentType && contentType.startsWith('multipart/form-data')) {
      const { files } = await parseForm(req);
      const uploadedFile = Array.isArray(files.file) ? files.file[0] : files.file;

      if (!uploadedFile) {
        return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
      }

      // Read file content
      const fileBuffer = fs.readFileSync(uploadedFile.filepath);

      // Convert Buffer to array of numbers for the flow
      const fileData = Array.from(fileBuffer);

      // Call your flow with file data in the correct format
      const response = await createFlowsEndpoint(flow, { fileData: fileData, fileName: uploadedFile.originalFilename });

      // Clean up the temporary file created by formidable
      fs.unlink(uploadedFile.filepath, (err) => {
        if (err) console.error("Error deleting temporary file:", err);
      });

      return NextResponse.json(response);

    } else {
      // Handle regular JSON requests for other flows if necessary
      const body = await req.json();
      const response = await createFlowsEndpoint(flow, body);
      return NextResponse.json(response);
    }

  } catch (err: any) {
    console.error("Flow execution error:", err);
    return NextResponse.json({ error: err.message || 'Flow execution failed' }, { status: 500 });
  }
}

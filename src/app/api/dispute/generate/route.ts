
'use server';

import { NextRequest, NextResponse } from 'next/server'; // Import NextRequest and NextResponse

export async function POST(req: NextRequest) {
  // This is a minimal async function export
  return new Response("OK");
}

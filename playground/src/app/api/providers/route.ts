import { NextResponse } from 'next/server';
import { getAvailableModels } from '@/libs/provider-registry';

export async function GET() {
  return NextResponse.json({ providers: getAvailableModels() });
}

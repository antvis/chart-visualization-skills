import { NextResponse } from 'next/server';
import ProviderRegistry from '@/libs/provider-registry';

export async function GET() {
  const providers = ProviderRegistry.listProviders().map((p) => ({
    id: p.id,
    name: p.name,
    models: p.models,
    hasApiKey: p.hasApiKey
  }));

  return NextResponse.json({ providers });
}

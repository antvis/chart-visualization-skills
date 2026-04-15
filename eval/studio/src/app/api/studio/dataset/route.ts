import path from 'path';
import fs from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';

const DATA_DIR = path.resolve(process.cwd(), '../data');

function safePath(file: string): string {
  const resolved = path.resolve(DATA_DIR, path.basename(file));
  if (!resolved.startsWith(DATA_DIR + path.sep) && resolved !== DATA_DIR) {
    throw new Error('Invalid path');
  }
  if (!resolved.endsWith('.json')) {
    throw new Error('Only .json files are allowed');
  }
  return resolved;
}

export async function GET(req: NextRequest) {
  const file = req.nextUrl.searchParams.get('file');
  if (!file) {
    return NextResponse.json({ error: 'file parameter is required' }, { status: 400 });
  }
  try {
    const content = await fs.readFile(safePath(file), 'utf-8');
    return NextResponse.json(JSON.parse(content));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  const file = req.nextUrl.searchParams.get('file');
  if (!file) {
    return NextResponse.json({ error: 'file parameter is required' }, { status: 400 });
  }
  try {
    const body = await req.json();
    if (!Array.isArray(body)) {
      return NextResponse.json({ error: 'Request body must be a JSON array' }, { status: 400 });
    }
    await fs.writeFile(safePath(file), JSON.stringify(body, null, 2), 'utf-8');
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

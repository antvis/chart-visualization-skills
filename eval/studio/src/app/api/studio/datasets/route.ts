import path from 'path';
import fs from 'fs/promises';
import { NextResponse } from 'next/server';

const DATA_DIR = path.resolve(process.cwd(), '../data');

export async function GET() {
  try {
    const entries = await fs.readdir(DATA_DIR);
    const files = entries.filter((e) => e.endsWith('.json')).sort();
    return NextResponse.json(files);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

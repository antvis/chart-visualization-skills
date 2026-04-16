import path from 'path';
import fs from 'fs/promises';
import { NextResponse } from 'next/server';

const RESULT_DIR = path.resolve(process.cwd(), '../result');

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ file: string }> }
) {
  const { file } = await params;

  // Sanitize: only allow plain filenames, no path traversal
  const basename = path.basename(file);
  if (!basename.endsWith('.json') || basename !== file) {
    return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
  }

  try {
    const filePath = path.join(RESULT_DIR, basename);
    const raw = await fs.readFile(filePath, 'utf-8');
    return NextResponse.json(JSON.parse(raw));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 404 });
  }
}

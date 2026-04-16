import path from 'path';
import fs from 'fs/promises';
import { NextResponse } from 'next/server';

const RESULT_DIR = path.resolve(process.cwd(), '../result');

export async function GET() {
  try {
    const entries = await fs.readdir(RESULT_DIR);
    const files = entries
      .filter((e) => e.endsWith('.json') && e !== 'bad-case.json')
      .sort()
      .reverse(); // newest first

    const results = await Promise.all(
      files.map(async (name) => {
        try {
          const raw = await fs.readFile(path.join(RESULT_DIR, name), 'utf-8');
          const data = JSON.parse(raw);
          const stat = await fs.stat(path.join(RESULT_DIR, name));
          return {
            name,
            modified: stat.mtime.toISOString(),
            summary: {
              model: data.model,
              provider: data.provider,
              algorithm: data.algorithm,
              dataset: data.dataset,
              totalTests: data.summary?.totalTests ?? data.results?.length ?? 0,
              avgSimilarity: data.summary?.avgSimilarity ?? 0,
              successCount: data.summary?.successCount ?? 0,
            },
          };
        } catch {
          return { name, modified: '', summary: {} };
        }
      })
    );

    return NextResponse.json({ results });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

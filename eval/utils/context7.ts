/**
 * Context7 API Client
 */

const API_BASE = 'https://context7.com/api/v2';

const LIBRARY_ID_MAP: Record<string, string> = {
  g2: '/antvis/g2',
  g6: '/antvis/g6'
};

export function resolveLibraryId(library: string): string {
  return LIBRARY_ID_MAP[library] ?? `/antvis/${library}`;
}

export async function fetchDocs(
  query: string,
  libraryId: string,
  apiKey: string | undefined,
  tokens = 12000
): Promise<Record<string, unknown>> {
  if (!apiKey) throw new Error('Missing CONTEXT7_API_KEY');

  const url = new URL(`${API_BASE}/context`);
  url.searchParams.set('query', query);
  url.searchParams.set('libraryId', libraryId);
  url.searchParams.set('type', 'json');
  url.searchParams.set('tokens', String(tokens));

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      signal: controller.signal
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Context7 API error: ${res.status} ${body.slice(0, 200)}`);
    }
    return res.json() as Promise<Record<string, unknown>>;
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw new Error('Context7 API timeout (30s)');
    throw new Error(`Context7 request failed: ${(err as Error).message}`);
  } finally {
    clearTimeout(timeout);
  }
}

interface CodeSnippet {
  pageTitle?: string;
  codeTitle?: string;
  codeDescription?: string;
  codeLanguage?: string;
  codeList?: Array<{ code?: string; language?: string }>;
}

interface InfoSnippet {
  breadcrumb?: string;
  pageId?: string;
  content?: string;
}

export function formatDocs(data: Record<string, unknown>, maxResults = 6): string {
  const codeSnippets = (Array.isArray(data?.codeSnippets) ? data.codeSnippets : []) as CodeSnippet[];
  const infoSnippets = (Array.isArray(data?.infoSnippets) ? data.infoSnippets : []) as InfoSnippet[];
  const sections: string[] = [];

  for (const s of codeSnippets.slice(0, Math.ceil(maxResults * 0.7))) {
    const title = s.pageTitle?.trim() || s.codeTitle?.trim() || 'Code Snippet';
    const desc = s.codeDescription?.trim() ?? '';
    const blocks = Array.isArray(s.codeList)
      ? s.codeList
          .filter((b) => typeof b?.code === 'string' && b.code.trim().length > 0)
          .map(
            (b) =>
              `\`\`\`${(b.language || s.codeLanguage || 'javascript').trim()}\n${b.code}\n\`\`\``
          )
      : [];
    if (blocks.length === 0) continue;
    sections.push(`### ${title}\n${desc ? desc + '\n\n' : ''}${blocks.join('\n\n')}`);
  }

  for (const s of infoSnippets.slice(0, Math.floor(maxResults * 0.3))) {
    const title = (s.breadcrumb || s.pageId || 'Documentation').trim();
    const content = (s.content ?? '').trim();
    if (!content) continue;
    sections.push(`### ${title}\n${content}`);
  }

  return sections.join('\n\n---\n\n');
}

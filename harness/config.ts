/**
 * Harness Library Registry
 *
 * Central configuration for all supported libraries.
 * To add a new library, add an entry to LIBRARY_REGISTRY and provide:
 *   - a dataset file in eval/data/
 *   - a system prompt file in prompts/
 *   - skill docs in skills/{id}/references/
 */

export interface LibraryRefs {
  srcDir: string | null;
  docsDir: string | null;
}

export interface LibraryConfig {
  id: string;
  friendlyName: string;
  npmPackage: string;
  cdnUrl: string;
  windowGlobal: string;
  entry: string;
  skillsPath: string;
  buildCmd: string;
  detectPattern: string;
  defaultDataset: string;
  refs: LibraryRefs | null;
}

const LIBRARY_REGISTRY: Record<string, LibraryConfig> = {
  g2: {
    id: 'g2',
    friendlyName: 'AntV G2',
    npmPackage: '@antv/g2',
    cdnUrl: 'https://unpkg.com/@antv/g2@5.4.8/dist/g2.min.js',
    windowGlobal: 'G2',
    entry: 'Chart',
    skillsPath: 'antv-g2-chart/references',
    buildCmd: 'node dist/scripts/build.js',
    detectPattern: '@antv/g2',
    defaultDataset: 'g2-dataset-174.json',
    refs: (() => {
      const srcDir = process.env.G2_SRC_DIR || null;
      const docsDir = process.env.G2_DOCS_DIR || null;
      return srcDir || docsDir ? { srcDir, docsDir } : null;
    })()
  },
  g6: {
    id: 'g6',
    friendlyName: 'AntV G6',
    npmPackage: '@antv/g6',
    cdnUrl: 'https://unpkg.com/@antv/g6@5.1.0/dist/g6.min.js',
    windowGlobal: 'G6',
    entry: 'Graph',
    skillsPath: 'antv-g6-graph/references',
    buildCmd: 'node dist/scripts/build.js',
    detectPattern: '@antv/g6',
    defaultDataset: 'g6-dataset-100.json',
    refs: (() => {
      const srcDir = process.env.G6_SRC_DIR || null;
      const docsDir = process.env.G6_DOCS_DIR || null;
      return srcDir || docsDir ? { srcDir, docsDir } : null;
    })()
  }
};

export function getLibraryConfig(id: string): LibraryConfig {
  const config = LIBRARY_REGISTRY[id];
  if (!config) {
    const available = Object.keys(LIBRARY_REGISTRY).join(', ');
    throw new Error(`Unknown library: "${id}". Available: ${available}`);
  }
  return config;
}

export function listLibraries(): LibraryConfig[] {
  return Object.values(LIBRARY_REGISTRY);
}

export { LIBRARY_REGISTRY };

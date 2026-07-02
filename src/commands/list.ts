import { Command } from 'commander';
import { listDocs } from '../core/retriever';
import { Doc } from '../api';

export function registerListCommand(program: Command): void {
  program
    .command('list')
    .description('List all available docs')
    .option('--library <lib>', 'Filter by library (g2 or g6)')
    .option('--category <cat>', 'Filter by category')
    .option('--tags <tags>', 'Filter by tags (comma-separated)')
    .option('--output <format>', 'Output format: json | text', 'text')
    .action(
      (opts: {
        library?: string;
        category?: string;
        tags?: string;
        output: string;
      }) => {
        const docs = listDocs({
          library: opts.library,
          category: opts.category || null,
          tags: opts.tags ? opts.tags.split(',').map((t) => t.trim()) : []
        });

        if (opts.output === 'json') {
          console.log(JSON.stringify(docs, null, 2));
          return;
        }

        const groupedByLibrary: Record<string, Doc[]> = docs.reduce(
          (acc: Record<string, Doc[]>, doc) => {
            if (!acc[doc.library]) acc[doc.library] = [];
            acc[doc.library].push(doc);
            return acc;
          },
          {}
        );

        console.log(`Total docs found: ${docs.length}\n`);
        for (const [lib, libDocs] of Object.entries(groupedByLibrary)) {
          console.log(`${lib.toUpperCase()}  (${libDocs.length} docs)`);
          for (const doc of libDocs) {
            console.log(`  ${doc.id.padEnd(48)} ${doc.title}`);
          }
          console.log();
        }
      }
    );
}

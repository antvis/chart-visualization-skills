import { Command } from 'commander';
import { retrieve } from '../core/retriever';

export function registerRetrieveCommand(program: Command): void {
  program
    .command('retrieve <query>')
    .description('Search for docs matching a query')
    .option('--library <lib>', 'Filter by library (g2, g6, x6)')
    .option('--topk <n>', 'Number of results to return', '7')
    .option('--strategy <s>', 'Retrieval strategy: hybrid | vector', 'hybrid')
    .option('--content', 'Include markdown content of matched reference docs (constraints are always prepended when content is shown)')
    .option('--output <format>', 'Output format: json | text', 'text')
    .action(
      async (
        query: string,
        opts: {
          library?: string;
          topk: string;
          strategy: string;
          content?: true;
          output: string;
        }
      ) => {
        const topK = parseInt(opts.topk, 10) || 7;
        const strategy = opts.strategy === 'vector' ? 'vector' : 'hybrid';
        const withContent = !!opts.content;

        const docs = await retrieve(query, {
          library: opts.library,
          topK,
          content: withContent,
          includeConstraints: withContent,
          strategy,
        });

        if (opts.output === 'json') {
          console.log(JSON.stringify(docs, null, 2));
          return;
        }

        const refDocs = docs.filter((d) => !d.id.startsWith('__info__'));
        const infoDocs = docs.filter((d) => d.id.startsWith('__info__'));

        if (infoDocs.length > 0) {
          for (const infoDoc of infoDocs) {
            console.log(`${'═'.repeat(60)}`);
            console.log(`  DOC CONSTRAINTS: ${infoDoc.title}`);
            console.log(`${'═'.repeat(60)}`);
            if (infoDoc.content) console.log(infoDoc.content);
            console.log();
          }
        }

        if (refDocs.length === 0) {
          console.log('No reference documents found.');
          return;
        }

        console.log(`Total ${refDocs.length} documents found:`);
        for (const [i, doc] of refDocs.entries()) {
          console.log(`\n${'─'.repeat(50)}`);
          console.log(`[${i + 1}] ${doc.title}  (${doc.id})`);
          console.log(
            `    Category : ${doc.category}${doc.subcategory ? '/' + doc.subcategory : ''}`
          );
          console.log(`    Tags     : ${doc.tags.join(', ')}`);
          console.log(`    Desc     : ${doc.description}`);
          if (doc.use_cases.length)
            console.log(`    Cases    : ${doc.use_cases.join(' / ')}`);
          if (doc.anti_patterns.length)
            console.log(`    Avoid    : ${doc.anti_patterns.join(' / ')}`);
          if (doc.content) {
            console.log(`\n${doc.content}`);
          }
        }
      }
    );
}

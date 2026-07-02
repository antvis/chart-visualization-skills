import { Command } from 'commander';
import { getDocById } from '../core/retriever';

export function registerGetCommand(program: Command): void {
  program
    .command('get <id>')
    .description('Get a doc by its exact ID')
    .option('--library <lib>', 'Restrict search to a specific library')
    .option('--output <format>', 'Output format: json | text', 'text')
    .action((id: string, opts: { library?: string; output: string }) => {
      const doc = getDocById(id, opts.library);

      if (!doc) {
        const hint = opts.library ? ` in library "${opts.library}"` : '';
        console.error(`Doc not found: "${id}"${hint}`);
        console.error('Tip: run `antv list` to browse available doc IDs.');
        process.exit(1);
      }

      if (opts.output === 'json') {
        console.log(JSON.stringify(doc, null, 2));
        return;
      }

      console.log(`${'─'.repeat(50)}`);
      console.log(`${doc.title}  (${doc.id})`);
      console.log(`Library  : ${doc.library}  v${doc.version}`);
      console.log(
        `Category : ${doc.category}${doc.subcategory ? '/' + doc.subcategory : ''}`
      );
      console.log(`Tags     : ${doc.tags.join(', ')}`);
      console.log(`Desc     : ${doc.description}`);
      if (doc.use_cases.length)
        console.log(`Cases    : ${doc.use_cases.join(' / ')}`);
      if (doc.anti_patterns.length)
        console.log(`Avoid    : ${doc.anti_patterns.join(' / ')}`);
      if (doc.related.length)
        console.log(`Related  : ${doc.related.join(', ')}`);
      if (doc.content) {
        console.log(`\n${doc.content}`);
      }
    });
}

import { Command } from 'commander';
import { getDocInfo } from '../core/retriever';

export function registerInfoCommand(program: Command): void {
  program
    .command('info')
    .description('Show doc info from DOC.md')
    .option('--library <lib>', 'Library to show info for (g2 or g6)', 'g2')
    .option('--output <format>', 'Output format: json | text', 'text')
    .action((opts: { library: string; output: string }) => {
      const doc = getDocInfo(opts.library);

      if (!doc) {
        console.error(`No doc info found for library: ${opts.library}`);
        process.exit(1);
      }

      if (opts.output === 'json') {
        console.log(JSON.stringify(doc, null, 2));
        return;
      }

      console.log(`${doc.name}: ${doc.description}\n\n${doc.content}`);
    });
}

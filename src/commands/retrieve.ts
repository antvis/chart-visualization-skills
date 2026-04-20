import { Command } from 'commander';
import { retrieve } from '../core/retriever';

export function registerRetrieveCommand(program: Command): void {
  program
    .command('retrieve <query>')
    .description('Search for skills matching a query')
    .option('--library <lib>', 'Filter by library (g2 or g6)')
    .option('--topk <n>', 'Number of results to return', '7')
    .option('--content', 'Include markdown content body')
    .option('--output <format>', 'Output format: json | text', 'text')
    .action(
      (
        query: string,
        opts: { library?: string; topk: string; content?: true; output: string }
      ) => {
        const topK = parseInt(opts.topk, 10) || 7;
        const skills = retrieve(query, {
          library: opts.library,
          topK,
          content: !!opts.content
        });

        if (opts.output === 'json') {
          console.log(JSON.stringify(skills, null, 2));
          return;
        }

        if (skills.length === 0) {
          console.log('No skills found.');
          return;
        }

        console.log(`Total ${skills.length} documents found:`);
        for (const [i, skill] of skills.entries()) {
          console.log(`\n${'─'.repeat(50)}`);
          console.log(`[${i + 1}] ${skill.title}  (${skill.id})`);
          console.log(
            `    Category : ${skill.category}${skill.subcategory ? '/' + skill.subcategory : ''}`
          );
          console.log(`    Tags     : ${skill.tags.join(', ')}`);
          console.log(`    Desc     : ${skill.description}`);
          if (skill.use_cases.length)
            console.log(`    Cases    : ${skill.use_cases.join(' / ')}`);
          if (skill.anti_patterns.length)
            console.log(`    Avoid    : ${skill.anti_patterns.join(' / ')}`);
          if (skill.content) {
            console.log(`\n${skill.content}`);
          }
        }
      }
    );
}

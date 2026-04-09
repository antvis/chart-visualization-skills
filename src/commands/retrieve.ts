import { Command } from 'commander';
import { retrieve } from '../core/retriever';

export function registerRetrieveCommand(program: Command): void {
  program
    .command('retrieve <query>')
    .description('Search for skills matching a query')
    .option('--library <lib>', 'Filter by library (g2 or g6)')
    .option('--topk <n>', 'Number of results to return', '7')
    .action((query: string, opts: { library?: string; topk: string }) => {
      const topK = parseInt(opts.topk, 10) || 7;
      const skills = retrieve(query, { library: opts.library, topK });

      if (skills.length === 0) {
        console.log('No skills found.');
        return;
      }

      console.log(`\nFound ${skills.length} skills:\n`);
      skills.forEach((skill, i) => {
        console.log(`${i + 1}. ${skill.title}`);
        console.log(`   ID: ${skill.id}`);
        console.log(`   Category: ${skill.category}${skill.subcategory ? '/' + skill.subcategory : ''}`);
        console.log(`   Tags: ${skill.tags.join(', ')}`);
        console.log(`   Description: ${skill.description.slice(0, 100)}...`);
        console.log();
      });
    });
}

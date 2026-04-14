import { Command } from 'commander';
import { retrieve } from '../core/retriever';

export function registerRetrieveCommand(program: Command): void {
  program
    .command('retrieve <query>')
    .description('Search for skills matching a query')
    .option('--library <lib>', 'Filter by library (g2 or g6)')
    .option('--topk <n>', 'Number of results to return', '7')
    .option('--content', 'Include markdown content body')
    .action((query: string, opts: { library?: string; topk: string; content?: true }) => {
      const topK = parseInt(opts.topk, 10) || 7;
      const skills = retrieve(query, { library: opts.library, topK, content: !!opts.content });

      if (skills.length === 0) {
        console.log('No skills found.');
        return;
      }

      const summary = `Total ${skills.length} documents found:`;
      const content = skills.map((skill, i) => `
${i + 1}. ${skill.title}
  ID: ${skill.id}
  Category: ${skill.category}${skill.subcategory ? '/' + skill.subcategory : ''}
  Tags: ${skill.tags.join(', ')}
  Description: ${skill.description}
  Content: ${skill.content ?? '' }
  Use Cases: ${skill.use_cases.join(', ')}
  Anti Patterns: ${skill.anti_patterns.join(', ')}`.trim());

      console.log(`${summary}\n${content.join('\n')}`);
    });
}

import { Command } from 'commander';
import { retrieve } from '../core/retriever';

export function registerRetrieveCommand(program: Command): void {
  program
    .command('retrieve <query>')
    .description('Search for skills matching a query')
    .option('--library <lib>', 'Filter by library (g2, g6, x6)')
    .option('--topk <n>', 'Number of results to return', '7')
    .option('--strategy <s>', 'Retrieval strategy: hybrid | vector', 'hybrid')
    .option('--content', 'Include markdown content of matched reference docs (SKILL.md constraints are always prepended)')
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

        const skills = await retrieve(query, {
          library: opts.library,
          topK,
          content: withContent,
          includeInfo: withContent,
          strategy,
        });

        if (opts.output === 'json') {
          console.log(JSON.stringify(skills, null, 2));
          return;
        }

        const refSkills = skills.filter((s) => !s.id.startsWith('__info__'));
        const infoSkills = skills.filter((s) => s.id.startsWith('__info__'));

        if (infoSkills.length > 0) {
          for (const infoSkill of infoSkills) {
            console.log(`${'═'.repeat(60)}`);
            console.log(`  SKILL CONSTRAINTS: ${infoSkill.title}`);
            console.log(`${'═'.repeat(60)}`);
            if (infoSkill.content) console.log(infoSkill.content);
            console.log();
          }
        }

        if (refSkills.length === 0) {
          console.log('No reference documents found.');
          return;
        }

        console.log(`Total ${refSkills.length} documents found:`);
        for (const [i, skill] of refSkills.entries()) {
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

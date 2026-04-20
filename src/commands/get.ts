import { Command } from 'commander';
import { getSkillById } from '../core/retriever';

export function registerGetCommand(program: Command): void {
  program
    .command('get <id>')
    .description('Get a skill by its exact ID')
    .option('--library <lib>', 'Restrict search to a specific library')
    .option('--output <format>', 'Output format: json | text', 'text')
    .action((id: string, opts: { library?: string; output: string }) => {
      const skill = getSkillById(id, opts.library);

      if (!skill) {
        const hint = opts.library ? ` in library "${opts.library}"` : '';
        console.error(`Skill not found: "${id}"${hint}`);
        console.error('Tip: run `antv list` to browse available skill IDs.');
        process.exit(1);
      }

      if (opts.output === 'json') {
        console.log(JSON.stringify(skill, null, 2));
        return;
      }

      console.log(`${'─'.repeat(50)}`);
      console.log(`${skill.title}  (${skill.id})`);
      console.log(`Library  : ${skill.library}  v${skill.version}`);
      console.log(
        `Category : ${skill.category}${skill.subcategory ? '/' + skill.subcategory : ''}`
      );
      console.log(`Tags     : ${skill.tags.join(', ')}`);
      console.log(`Desc     : ${skill.description}`);
      if (skill.use_cases.length)
        console.log(`Cases    : ${skill.use_cases.join(' / ')}`);
      if (skill.anti_patterns.length)
        console.log(`Avoid    : ${skill.anti_patterns.join(' / ')}`);
      if (skill.related.length)
        console.log(`Related  : ${skill.related.join(', ')}`);
      if (skill.content) {
        console.log(`\n${skill.content}`);
      }
    });
}

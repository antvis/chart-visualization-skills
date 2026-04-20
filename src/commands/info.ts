import { Command } from 'commander';
import { getSkillInfo } from '../core/retriever';

export function registerInfoCommand(program: Command): void {
  program
    .command('info')
    .description('Show skill info from SKILL.md')
    .option('--library <lib>', 'Library to show info for (g2 or g6)', 'g2')
    .option('--json', 'Output as JSON (for scripting)')
    .action((opts: { library: string; json?: true }) => {
      const skill = getSkillInfo(opts.library);

      if (!skill) {
        console.error(`No skill info found for library: ${opts.library}`);
        process.exit(1);
      }

      if (opts.json) {
        console.log(JSON.stringify(skill, null, 2));
        return;
      }

      console.log(`${skill.name}: ${skill.description}\n\n${skill.content}`);
    });
}

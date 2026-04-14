import { Command } from 'commander';
import { getSkillInfo } from '../core/retriever';

export function registerInfoCommand(program: Command): void {
  program
    .command('info')
    .description('Show skill info from SKILL.md')
    .option('--library <lib>', 'Library to show info for (g2 or g6)', 'g2')
    .action((opts: { library: string }) => {
      const skill = getSkillInfo(opts.library);

      if (!skill) {
        console.log(`No skill info found for library: ${opts.library}`);
        return;
      }

      console.log(`${skill.name}: ${skill.description}\n\n${skill.content}`);
    });
}

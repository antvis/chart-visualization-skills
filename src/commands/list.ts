import { Command } from 'commander';
import { listSkills } from '../core/retriever';
import { Skill } from '../api';

export function registerListCommand(program: Command): void {
  program
    .command('list')
    .description('List all available skills')
    .option('--library <lib>', 'Filter by library (g2 or g6)')
    .option('--category <cat>', 'Filter by category')
    .option('--tags <tags>', 'Filter by tags (comma-separated)')
    .option(
      '--difficulty <level>',
      'Filter by difficulty (beginner|intermediate|advanced)'
    )
    .option('--output <format>', 'Output format: json | text', 'text')
    .action(
      (opts: {
        library?: string;
        category?: string;
        tags?: string;
        difficulty?: string;
        output: string;
      }) => {
        const skills = listSkills({
          library: opts.library,
          category: opts.category || null,
          tags: opts.tags ? opts.tags.split(',').map((t) => t.trim()) : [],
          difficulty: opts.difficulty || null
        });

        if (opts.output === 'json') {
          console.log(JSON.stringify(skills, null, 2));
          return;
        }

        const groupedByLibrary: Record<string, Skill[]> = skills.reduce(
          (acc: Record<string, Skill[]>, skill) => {
            if (!acc[skill.library]) acc[skill.library] = [];
            acc[skill.library].push(skill);
            return acc;
          },
          {}
        );

        console.log(`Total skills found: ${skills.length}\n`);
        for (const [lib, libSkills] of Object.entries(groupedByLibrary)) {
          console.log(`${lib.toUpperCase()}  (${libSkills.length} skills)`);
          for (const skill of libSkills) {
            console.log(`  ${skill.id.padEnd(48)} ${skill.title}`);
          }
          console.log();
        }
      }
    );
}

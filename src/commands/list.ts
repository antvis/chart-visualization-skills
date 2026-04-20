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
    .option('--stats', 'Show category statistics instead of full list')
    .option('--json', 'Output as JSON (for scripting)')
    .action(
      (opts: {
        library?: string;
        category?: string;
        tags?: string;
        difficulty?: string;
        stats?: true;
        json?: true;
      }) => {
        const skills = listSkills({
          library: opts.library,
          category: opts.category || null,
          tags: opts.tags ? opts.tags.split(',').map((t) => t.trim()) : [],
          difficulty: opts.difficulty || null
        });

        if (opts.json) {
          console.log(JSON.stringify(skills, null, 2));
          return;
        }

        if (opts.stats) {
          const byCategory = skills.reduce(
            (acc: Record<string, number>, skill) => {
              acc[skill.category] = (acc[skill.category] || 0) + 1;
              return acc;
            },
            {}
          );
          const grouped = Object.entries(byCategory).sort(
            ([, a], [, b]) => b - a
          );
          const libLabel = opts.library ? opts.library.toUpperCase() : 'ALL';
          console.log(`${libLabel}  (${skills.length} skills total)`);
          for (const [cat, count] of grouped) {
            console.log(`  ${cat.padEnd(20)} ${count}`);
          }
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

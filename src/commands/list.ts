import { Command } from 'commander';
import { listSkills } from '../core/retriever';

export function registerListCommand(program: Command): void {
  program
    .command('list')
    .description('List all available skills')
    .option('--library <lib>', 'Filter by library (g2 or g6)')
    .option('--category <cat>', 'Filter by category')
    .option('--tags <tags>', 'Filter by tags (comma-separated)')
    .option('--difficulty <level>', 'Filter by difficulty (beginner|intermediate|advanced)')
    .action((opts: { library?: string; category?: string; tags?: string; difficulty?: string }) => {
      const tags = opts.tags ? opts.tags.split(',').map(t => t.trim()) : [];
      const skills = listSkills({
        library: opts.library,
        category: opts.category || null,
        tags,
        difficulty: opts.difficulty || null,
      });

      console.log(`\nSkills (${skills.length} total):\n`);

      const byLibrary: Record<string, typeof skills> = {};
      for (const skill of skills) {
        if (!byLibrary[skill.library]) byLibrary[skill.library] = [];
        byLibrary[skill.library].push(skill);
      }

      for (const [lib, libSkills] of Object.entries(byLibrary)) {
        console.log(`${lib.toUpperCase()} (${libSkills.length}):`);
        for (const skill of libSkills) {
          console.log(`  - ${skill.id} - ${skill.title}`);
        }
        console.log();
      }
    });
}

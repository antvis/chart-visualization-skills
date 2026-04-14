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
    .option('--difficulty <level>', 'Filter by difficulty (beginner|intermediate|advanced)')
    .action((opts: { library?: string; category?: string; tags?: string; difficulty?: string }) => {
      const skills = listSkills({
        library: opts.library,
        category: opts.category || null,
        tags: opts.tags ? opts.tags.split(',').map(t => t.trim()) : [],
        difficulty: opts.difficulty || null,
      });

      const summary = `Total skills found: ${skills.length}`;

      const groupedByLibrary: Record<string, Skill[]> = skills.reduce((acc: Record<string, Skill[]>, skill) => {
        if (!acc[skill.library]) {
          acc[skill.library] = [];
        }
        acc[skill.library].push(skill);
        return acc;
      }, {});

      const content = Object.entries(groupedByLibrary).map(([lib, libSkills]) => {
        const skillList = libSkills.map(skill => `  - ${skill.id}: ${skill.title}`).join('\n');
        return `${lib.toUpperCase()}, ${libSkills.length} documents found:\n${skillList}`;
      }).join('\n\n');

      console.log(`${summary}\n\n${content}`);
    });
}

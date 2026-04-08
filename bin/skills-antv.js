#!/usr/bin/env node
/**
 * AntV Skills CLI
 *
 * Global CLI tool for managing AntV G2/G6 skills.
 *
 * Usage:
 *   skills-antv build              Build skill indexes
 *   skills-antv validate           Validate skill files
 *   skills-antv retrieve <query>   Search for skills
 *   skills-antv prompt <query>     Generate system prompt
 *   skills-antv list               List all skills
 *   skills-antv --version          Show version
 *   skills-antv --help             Show help
 */

// Load environment variables from .env file
require('dotenv').config({ override: true });

const fs = require('fs');
const { SkillBuilder } = require('../utils/builder');
const { SkillRetriever } = require('../utils/retriever');
const { SkillValidator } = require('../utils/validator');

const pkg = require('../package.json');

// CLI Argument parsing
function parseArgs() {
  const args = process.argv.slice(2);
  const command = args[0];
  const flags = {};
  const positional = [];

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');
      flags[key] = value !== undefined ? value : true;
    } else if (arg.startsWith('-')) {
      flags[arg.slice(1)] = true;
    } else {
      positional.push(arg);
    }
  }

  return { command, flags, positional };
}

// Show help
function showHelp() {
  console.log(`
${pkg.name} v${pkg.version}
${pkg.description}

Usage: skills-antv <command> [options]

Commands:
  build                    Build skill indexes from markdown files
  validate                 Validate skill file format and content
  retrieve <query>         Search for skills matching query
  prompt <query>           Generate system prompt for LLM
  list                     List all available skills
  version                  Show version number
  help                     Show this help message

Options:
  --library=<g2|g6>        Filter by library (g2 or g6)
  --category=<cat>         Filter by category
  --tags=<tag1,tag2>       Filter by tags (comma-separated)
  --difficulty=<level>     Filter by difficulty (beginner|intermediate|advanced)
  --topK=<n>               Number of results to return (default: 5)
  --output=<file>          Write output to file
  --json                   Output as JSON
  --silent                 Suppress console output
  -y, --yes                Auto-confirm prompts

Examples:
  skills-antv build
  skills-antv validate
  skills-antv retrieve "how to create bar chart"
  skills-antv retrieve "force layout" --library=g6
  skills-antv prompt "stacked bar chart" --output=prompt.txt
  skills-antv list --library=g2 --category=marks
  skills-antv list --tags=interval,beginner
`);
}

// Command: build
function cmdBuild(flags) {
  const silent = flags.silent || false;
  const builder = new SkillBuilder();

  try {
    const result = builder.build({ silent });
    if (flags.json) {
      console.log(JSON.stringify(result, null, 2));
    }
    return 0;
  } catch (err) {
    console.error(`❌ Build failed: ${err.message}`);
    return 1;
  }
}

// Command: validate
function cmdValidate(flags) {
  const silent = flags.silent || false;
  const validator = new SkillValidator();

  try {
    const result = validator.validate({ silent });
    if (flags.json) {
      console.log(JSON.stringify(result, null, 2));
    }
    return result.valid ? 0 : 1;
  } catch (err) {
    console.error(`❌ Validation failed: ${err.message}`);
    return 1;
  }
}

// Command: retrieve
function cmdRetrieve(query, flags) {
  if (!query) {
    console.error(
      '❌ Error: Query is required. Usage: skills-antv retrieve <query>'
    );
    return 1;
  }

  const retriever = new SkillRetriever();
  const library = flags.library || null;
  const topK = parseInt(flags.topK) || 5;

  try {
    const skills = retriever.retrieve(query, { library, topK });

    if (flags.json) {
      console.log(JSON.stringify(skills, null, 2));
    } else {
      console.log(`\n🔍 Query: ${query}`);
      if (library) console.log(`📚 Library: ${library.toUpperCase()}`);
      console.log(`✅ Found ${skills.length} skills:\n`);

      skills.forEach((skill, i) => {
        console.log(`${i + 1}. ${skill.title}`);
        console.log(`   ID: ${skill.id}`);
        console.log(
          `   Category: ${skill.category}${skill.subcategory ? '/' + skill.subcategory : ''}`
        );
        console.log(`   Tags: ${skill.tags.join(', ')}`);
        console.log(`   Description: ${skill.description.slice(0, 100)}...`);
        console.log();
      });
    }

    if (flags.output) {
      fs.writeFileSync(flags.output, JSON.stringify(skills, null, 2), 'utf-8');
      console.log(`💾 Results saved to ${flags.output}`);
    }

    return 0;
  } catch (err) {
    console.error(`❌ Retrieval failed: ${err.message}`);
    return 1;
  }
}

// Command: prompt
function cmdPrompt(query, flags) {
  if (!query) {
    console.error(
      '❌ Error: Query is required. Usage: skills-antv prompt <query>'
    );
    return 1;
  }

  const retriever = new SkillRetriever();
  const library = flags.library || null;
  const topK = parseInt(flags.topK) || 5;

  try {
    const result = retriever.buildPrompt(query, { library, topK });

    if (flags.json) {
      console.log(
        JSON.stringify(
          {
            systemPrompt: result.systemPrompt,
            retrievedSkills: result.retrievedSkills,
            library: result.library
          },
          null,
          2
        )
      );
    } else {
      console.log(`\n🔍 Query: ${query}`);
      console.log(`📚 Library: ${result.library.toUpperCase()}`);
      console.log(
        `✅ Retrieved ${result.retrievedSkills.length} skills: ${result.retrievedSkills.join(', ')}`
      );
      console.log(
        `\n📝 System Prompt (${result.systemPrompt.length} chars):\n`
      );
      console.log('='.repeat(60));
      console.log(result.systemPrompt.slice(0, 1000));
      if (result.systemPrompt.length > 1000) {
        console.log('... (truncated)');
      }
      console.log('='.repeat(60));
    }

    if (flags.output) {
      fs.writeFileSync(flags.output, result.systemPrompt, 'utf-8');
      console.log(`\n💾 Prompt saved to ${flags.output}`);
    }

    return 0;
  } catch (err) {
    console.error(`❌ Prompt generation failed: ${err.message}`);
    return 1;
  }
}

// Command: list
function cmdList(flags) {
  const retriever = new SkillRetriever();

  const options = {
    library: flags.library || null,
    category: flags.category || null,
    difficulty: flags.difficulty || null,
    tags: flags.tags ? flags.tags.split(',').map((t) => t.trim()) : []
  };

  try {
    const skills = retriever.list(options);

    if (flags.json) {
      console.log(JSON.stringify(skills, null, 2));
    } else {
      console.log(`\n📚 Skills (${skills.length} total):\n`);

      // Group by library
      const byLibrary = {};
      skills.forEach((skill) => {
        if (!byLibrary[skill.library]) byLibrary[skill.library] = [];
        byLibrary[skill.library].push(skill);
      });

      Object.entries(byLibrary).forEach(([lib, libSkills]) => {
        console.log(`${lib.toUpperCase()} (${libSkills.length}):`);
        libSkills.forEach((skill) => {
          console.log(`  • ${skill.id} - ${skill.title}`);
        });
        console.log();
      });
    }

    if (flags.output) {
      fs.writeFileSync(flags.output, JSON.stringify(skills, null, 2), 'utf-8');
      console.log(`💾 List saved to ${flags.output}`);
    }

    return 0;
  } catch (err) {
    console.error(`❌ List failed: ${err.message}`);
    return 1;
  }
}

// Main entry
function main() {
  const { command, flags, positional } = parseArgs();

  // Handle help flags (check raw args for --help before command parsing)
  const rawArgs = process.argv.slice(2);
  if (
    rawArgs.includes('--help') ||
    rawArgs.includes('-h') ||
    command === 'help' ||
    !command
  ) {
    showHelp();
    return 0;
  }

  // Handle version (check raw args like --help)
  if (
    rawArgs.includes('--version') ||
    rawArgs.includes('-v') ||
    command === 'version'
  ) {
    console.log(pkg.version);
    return 0;
  }

  // Route commands
  switch (command) {
    case 'build':
      return cmdBuild(flags);

    case 'validate':
      return cmdValidate(flags);

    case 'retrieve':
      return cmdRetrieve(positional.join(' '), flags);

    case 'prompt':
      return cmdPrompt(positional.join(' '), flags);

    case 'list':
      return cmdList(flags);

    default:
      console.error(`❌ Unknown command: ${command}`);
      console.error('Run "skills-antv help" for usage information.');
      return 1;
  }
}

// Run if executed directly
if (require.main === module) {
  process.exit(main());
}

module.exports = { main, parseArgs };

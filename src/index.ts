#!/usr/bin/env node

import { Command } from 'commander';
import path from 'path';
import { registerRetrieveCommand } from './commands/retrieve';
import { registerListCommand } from './commands/list';
import { registerInfoCommand } from './commands/info';
import { registerGetCommand } from './commands/get';

const pkg = require(path.resolve(__dirname, '../package.json'));

const program = new Command();

program
  .name('antv')
  .description('CLI tool for AntV chart visualization skills retrieval')
  .version(pkg.version)
  .option('--debug', 'Show full stack trace on error');

registerRetrieveCommand(program);
registerGetCommand(program);
registerListCommand(program);
registerInfoCommand(program);

// Wrap parse() so errors thrown inside synchronous action handlers are caught
// here rather than relying on the global uncaughtException hook, which would
// also swallow unexpected programming errors (TypeError, ReferenceError, etc.).
// Pass --debug to see the full stack when debugging unexpected failures.
try {
  program.parse();
} catch (err) {
  const debug = process.argv.includes('--debug');
  if (debug) {
    console.error(err);
  } else {
    console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
  }
  process.exit(1);
}

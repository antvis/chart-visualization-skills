#!/usr/bin/env node

import { Command } from 'commander';
import path from 'path';
import { registerRetrieveCommand } from './commands/retrieve';

const pkg = require(path.resolve(__dirname, '../package.json'));

const program = new Command();

program
  .name('antv')
  .description('CLI tool for AntV chart visualization docs retrieval')
  .version(pkg.version)
  .option('--debug', 'Show full stack trace on error');

registerRetrieveCommand(program);

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

#!/usr/bin/env node

// Catch unhandled errors thrown inside Commander action handlers and
// print only the message — no stack trace for expected CLI errors.
process.on('uncaughtException', (err) => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});

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
  .version(pkg.version);

registerRetrieveCommand(program);
registerGetCommand(program);
registerListCommand(program);
registerInfoCommand(program);

program.parse();

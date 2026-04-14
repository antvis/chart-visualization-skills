#!/usr/bin/env node

import { Command } from 'commander';
import path from 'path';
import { registerRetrieveCommand } from './commands/retrieve';
import { registerListCommand } from './commands/list';
import { registerInfoCommand } from './commands/info';

const pkg = require(path.resolve(__dirname, '../package.json'));

const program = new Command();

program
  .name('antv')
  .description('CLI tool for AntV chart visualization skills retrieval')
  .version(pkg.version);

registerRetrieveCommand(program);
registerListCommand(program);
registerInfoCommand(program);

program.parse();

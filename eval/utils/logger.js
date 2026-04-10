'use strict';

/**
 * Shared pino logger for eval and harness modules.
 *
 * Outputs structured JSON in non-TTY environments (CI/piped),
 * and human-readable pretty-printed lines when stdout is a TTY.
 *
 * Override log level with LOG_LEVEL env var (trace|debug|info|warn|error).
 */

const pino = require('pino');

const level = process.env.LOG_LEVEL || 'info';

const transport =
  process.stderr.isTTY || process.stdout.isTTY
    ? pino.transport({
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname',
          messageFormat: '{msg}'
        }
      })
    : undefined;

const logger = pino({ level }, transport);

module.exports = logger;

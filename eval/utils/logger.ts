'use strict';
/**
 * Shared pino logger for eval and harness modules.
 */

import pino from 'pino';

const level = process.env.LOG_LEVEL ?? 'info';

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

export default logger;

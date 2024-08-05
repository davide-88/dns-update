import { ConsoleLogger } from './console-logger.js';
import { loggerLevelUtils, type LogLevelLabel } from './log-level.js';

export const loggerFactory = {
  create: ({
    level,
    context,
  }: { level?: LogLevelLabel; context?: string } = {}) => {
    return new ConsoleLogger({
      level: loggerLevelUtils.parse({ level }),
      context,
    });
  },
};

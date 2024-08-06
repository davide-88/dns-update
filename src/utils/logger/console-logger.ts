import { inspect } from 'node:util';

import { levelByLabel, LOG_LEVEL_LABEL, LogLevel } from './log-level.js';
import { Logger } from './logger.js';

const consoleMethodsByLogLevel: {
  [key in LogLevel['label']]: (
    message?: unknown,
    ...optionalParams: unknown[]
  ) => void;
} = {
  [LOG_LEVEL_LABEL.DEBUG]: console.log,
  [LOG_LEVEL_LABEL.INFO]: console.info,
  [LOG_LEVEL_LABEL.WARN]: console.warn,
  [LOG_LEVEL_LABEL.ERROR]: console.error,
};

const inspectOptions = {
  depth: null,
  compact: true,
  breakLength: Number.POSITIVE_INFINITY,
  maxArrayLength: Number.POSITIVE_INFINITY,
  maxStringLength: Number.POSITIVE_INFINITY,
  sorted: true,
};

export class ConsoleLogger implements Logger {
  private readonly level: LogLevel;
  public readonly context?: string;
  private readonly argSerializer: (
    arg?: unknown,
  ) => string | unknown | undefined;

  constructor({ level, context }: { level: LogLevel; context?: string }) {
    this.level = level;
    this.context = context;
    this.argSerializer = (arg?: unknown): string | unknown | undefined => {
      return arg && typeof arg === 'object'
        ? inspect(arg, inspectOptions)
        : arg;
    };
  }

  log(message: unknown): void {
    this._log(levelByLabel.INFO, message);
  }

  debug(message: unknown): void {
    this._log(levelByLabel.DEBUG, message);
  }

  info(message: unknown): void {
    this._log(levelByLabel.INFO, message);
  }

  warn(message: unknown): void {
    this._log(levelByLabel.WARN, message);
  }

  error(message: unknown): void {
    this._log(levelByLabel.ERROR, message);
  }

  private _log(level: LogLevel, message: unknown) {
    if (level.isToBeLogged(this.level)) {
      consoleMethodsByLogLevel[level.label](
        inspect(
          {
            ...(this.context ? { context: this.context } : {}),
            level: level.label,
            message: this.argSerializer(message),
            timestamp: new Date().toISOString(),
          },
          inspectOptions,
        ),
      );
    }
  }
}

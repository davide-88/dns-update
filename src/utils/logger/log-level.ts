export const LOG_LEVEL_LABEL = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
} as const;

export type LogLevelLabel =
  (typeof LOG_LEVEL_LABEL)[keyof typeof LOG_LEVEL_LABEL];

export interface LogLevel {
  label: LogLevelLabel;
  level: number;
  isToBeLogged: (other: LogLevel) => boolean;
}

export class LogLevelImpl implements LogLevel {
  public readonly label: LogLevelLabel;
  public readonly level: number;

  constructor({ label, level }: { label: LogLevelLabel; level: number }) {
    this.label = label;
    this.level = level;
  }

  isToBeLogged(other: LogLevel): boolean {
    return this.level >= other.level;
  }
}

export const levelByLabel: { [key in LogLevelLabel]: LogLevel } = {
  [LOG_LEVEL_LABEL.DEBUG]: new LogLevelImpl({
    label: LOG_LEVEL_LABEL.DEBUG,
    level: 20,
  }),
  [LOG_LEVEL_LABEL.INFO]: new LogLevelImpl({
    label: LOG_LEVEL_LABEL.INFO,
    level: 30,
  }),
  [LOG_LEVEL_LABEL.WARN]: new LogLevelImpl({
    label: LOG_LEVEL_LABEL.WARN,
    level: 40,
  }),
  [LOG_LEVEL_LABEL.ERROR]: new LogLevelImpl({
    label: LOG_LEVEL_LABEL.ERROR,
    level: 50,
  }),
} as const;

export const loggerLevelUtils = {
  parse: ({ level }: { level?: string }): LogLevel => {
    const logLevel = (
      level ??
      process.env['LOG_LEVEL'] ??
      LOG_LEVEL_LABEL.INFO
    ).toUpperCase();
    const label = (
      logLevel in LOG_LEVEL_LABEL ? logLevel : LOG_LEVEL_LABEL.INFO
    ) as LogLevelLabel;
    return levelByLabel[label];
  },
};

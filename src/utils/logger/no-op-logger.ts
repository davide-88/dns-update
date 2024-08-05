import type { Logger } from './logger.js';

export class NoOpLogger implements Logger {
  private constructor() {
    // private constructor for singleton
  }

  public static new(): Logger {
    return new NoOpLogger();
  }

  debug(): void {
    // no-op
  }

  error(): void {
    // no-op
  }

  info(): void {
    // no-op
  }

  log(): void {
    // no-op
  }

  time(): void {
    // no-op
  }

  timeEnd(): void {
    // no-op
  }

  warn(): void {
    // no-op
  }
}

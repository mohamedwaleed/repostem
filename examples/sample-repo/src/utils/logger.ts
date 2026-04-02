export class Logger {
  private prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  log(message: string): void {
    console.log(`[${this.prefix}] ${message}`);
  }

  error(message: string): void {
    console.error(`[${this.prefix}] ERROR: ${message}`);
  }

  warn(message: string): void {
    console.warn(`[${this.prefix}] WARN: ${message}`);
  }
}

export function createLogger(name: string): Logger {
  return new Logger(name);
}

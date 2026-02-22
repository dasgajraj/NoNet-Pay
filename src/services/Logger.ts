type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

const VERBOSE = __DEV__;

function ts(): string {
  return new Date().toISOString().slice(11, 23);
}

function prefix(level: LogLevel, tag: string): string {
  return `[${ts()}] [${level}] [${tag}]`;
}

const Log = {
  debug(tag: string, message: string, data?: unknown) {
    if (!VERBOSE) return;
    if (data !== undefined) {
      console.debug(`${prefix('DEBUG', tag)} ${message}`, data);
    } else {
      console.debug(`${prefix('DEBUG', tag)} ${message}`);
    }
  },

  info(tag: string, message: string, data?: unknown) {
    if (data !== undefined) {
      console.info(`${prefix('INFO', tag)} ${message}`, data);
    } else {
      console.info(`${prefix('INFO', tag)} ${message}`);
    }
  },

  warn(tag: string, message: string, data?: unknown) {
    if (data !== undefined) {
      console.warn(`${prefix('WARN', tag)} ${message}`, data);
    } else {
      console.warn(`${prefix('WARN', tag)} ${message}`);
    }
  },

  error(tag: string, message: string, data?: unknown) {
    if (data !== undefined) {
      console.error(`${prefix('ERROR', tag)} ${message}`, data);
    } else {
      console.error(`${prefix('ERROR', tag)} ${message}`);
    }
  },
};

export default Log;
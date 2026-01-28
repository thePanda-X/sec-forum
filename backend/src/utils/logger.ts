const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4,
} as const;

export type LogLevel = keyof typeof LOG_LEVELS;

function getLogLevel(): LogLevel {
  const envLevel = process.env.LOG_LEVEL?.toUpperCase();
  if (envLevel && envLevel in LOG_LEVELS) {
    return envLevel as LogLevel;
  }
  return "INFO";
}

const currentLevel = LOG_LEVELS[getLogLevel()];

function formatTimestamp(): string {
  return new Date().toISOString();
}

function formatLog(level: LogLevel, message: string, meta?: Record<string, unknown>): string {
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : "";
  return `[${formatTimestamp()}] [${level}] ${message}${metaStr}`;
}

function shouldLog(level: LogLevel): boolean {
  return currentLevel <= LOG_LEVELS[level];
}

export const logger = {
  level: getLogLevel(),

  debug: (message: string, meta?: Record<string, unknown>) => {
    if (shouldLog("DEBUG")) {
      console.debug(formatLog("DEBUG", message, meta));
    }
  },

  info: (message: string, meta?: Record<string, unknown>) => {
    if (shouldLog("INFO")) {
      console.log(formatLog("INFO", message, meta));
    }
  },

  warn: (message: string, meta?: Record<string, unknown>) => {
    if (shouldLog("WARN")) {
      console.warn(formatLog("WARN", message, meta));
    }
  },

  error: (message: string, meta?: Record<string, unknown>) => {
    if (shouldLog("ERROR")) {
      console.error(formatLog("ERROR", message, meta));
    }
  },

  logRequest: (
    method: string,
    path: string,
    status?: number,
    duration?: number,
    userId?: number,
    queryParams?: Record<string, unknown>
  ) => {
    if (shouldLog("INFO")) {
      const meta: Record<string, unknown> = { method, path };
      if (status !== undefined) meta.status = status;
      if (duration !== undefined) meta.duration = `${duration.toFixed(2)}ms`;
      if (userId !== undefined) meta.userId = userId;
      if (queryParams && Object.keys(queryParams).length > 0) meta.query = queryParams;
      const icon = status && status >= 400 ? "✗" : "✓";
      console.log(formatLog("INFO", `${icon} ${method} ${path}`, meta));
    }
  },

  logErrorWithStack: (
    method: string,
    path: string,
    errorMessage: string,
    stack?: string,
    status?: number | string,
    duration?: string,
    body?: unknown
  ) => {
    if (shouldLog("INFO")) {
      const meta: Record<string, unknown> = { method, path, error: errorMessage };
      if (status !== undefined) meta.status = status;
      if (duration !== undefined) meta.duration = duration;
      if (stack) meta.stack = stack;
      if (body) meta.body = body;
      console.log(formatLog("INFO", `✗ ${method} ${path} - ${errorMessage}`, meta));
    }
  },
};

/**
 * Structured JSON Logger for WDS Enterprise Platform
 * 
 * Supports:
 * - Correlation IDs (requestId)
 * - ISO-8601 timestamps
 * - Log levels: debug, info, warn, error
 * - Structured metadata
 * - Sentry / Error Tracking hook
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  requestId?: string
  context?: Record<string, unknown>
  error?: {
    name: string
    message: string
    stack?: string
  }
}

class Logger {
  private formatLog(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    error?: Error,
    requestId?: string
  ): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...(requestId ? { requestId } : {}),
      ...(context ? { context } : {}),
      ...(error
        ? {
            error: {
              name: error.name,
              message: error.message,
              stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
            },
          }
        : {}),
    }
  }

  private output(entry: LogEntry) {
    const json = JSON.stringify(entry)
    switch (entry.level) {
      case 'error':
        console.error(json)
        break
      case 'warn':
        console.warn(json)
        break
      case 'info':
        console.info(json)
        break
      case 'debug':
        if (process.env.NODE_ENV !== 'production') {
          console.debug(json)
        }
        break
    }
  }

  debug(message: string, context?: Record<string, unknown>, requestId?: string) {
    this.output(this.formatLog('debug', message, context, undefined, requestId))
  }

  info(message: string, context?: Record<string, unknown>, requestId?: string) {
    this.output(this.formatLog('info', message, context, undefined, requestId))
  }

  warn(message: string, context?: Record<string, unknown>, requestId?: string) {
    this.output(this.formatLog('warn', message, context, undefined, requestId))
  }

  error(message: string, error?: Error, context?: Record<string, unknown>, requestId?: string) {
    const entry = this.formatLog('error', message, context, error, requestId)
    this.output(entry)

    // Sentry / External Alert hook
    if (process.env.SENTRY_DSN && typeof window === 'undefined') {
      // Sentry server-side exception capture
      try {
        const Sentry = (globalThis as any).__Sentry
        if (Sentry && typeof Sentry.captureException === 'function') {
          Sentry.captureException(error ?? new Error(message), {
            extra: { context, requestId },
          })
        }
      } catch {}
    }
  }

  withRequestId(requestId: string) {
    return {
      debug: (msg: string, ctx?: Record<string, unknown>) => this.debug(msg, ctx, requestId),
      info: (msg: string, ctx?: Record<string, unknown>) => this.info(msg, ctx, requestId),
      warn: (msg: string, ctx?: Record<string, unknown>) => this.warn(msg, ctx, requestId),
      error: (msg: string, err?: Error, ctx?: Record<string, unknown>) => this.error(msg, err, ctx, requestId),
    }
  }
}

export const logger = new Logger()

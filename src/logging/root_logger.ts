import * as os from 'os'
import pino from 'pino'
import { Logger, LoggingOptions } from './logging.types'
import { iso8601WithLocalOffset } from '../utils/date_utils'
import { isOptionEnabled } from '../utils/options'

export function createRootLogger(
  serviceName: string,
  opts?: LoggingOptions,
): RootLogger {
  const baseDefaults = {
    application_type: 'service',
    service: serviceName,
    host: os.hostname(),
  }
  const pinoOpts: pino.LoggerOptions = {
    enabled: isOptionEnabled(opts, true),
    base: opts?.base ? { ...baseDefaults, ...opts.base } : baseDefaults,
    timestamp: epochTimeAndIso8601WithLocalOffset,
    customLevels: uppercasePinoLevels,
    formatters: {
      level(label, _number) {
        return {
          loglevel: label,
        }
      },
    },
    ...opts,
  }
  return opts?.destination ? pino(pinoOpts, opts?.destination) : pino(pinoOpts)
}

export interface RootLogger {
  child: Logger['child']
  level: Logger['level']
  bindings: Logger['bindings']
}

const uppercasePinoLevels = Object.entries(pino.levels.values).reduce<
  typeof pino.levels.values
>((acc, [key, val]) => {
  acc[key.toUpperCase()] = val
  return acc
}, {})

function epochTimeAndIso8601WithLocalOffset(): string {
  const now = new Date()
  return `,"time":${now.getTime()},"@timestamp":"${iso8601WithLocalOffset(
    now,
  )}"`
}

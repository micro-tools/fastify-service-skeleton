import * as os from 'os'
import pino, { Logger } from 'pino'
import { iso8601WithLocalOffset } from '../utils/date_utils'

export function createLogger(
  serviceName: string,
  type: 'application' | 'access',
  opts?: LoggerOptions,
): Logger {
  const baseDefaults = {
    log_type: type,
    application_type: 'service',
    service: serviceName,
    host: os.hostname(),
  }
  const pinoOpts: pino.LoggerOptions = {
    base: opts?.base ? { ...baseDefaults, ...opts.base } : baseDefaults,
    timestamp: epochTimeAndIso8601WithLocalOffset,
    changeLevelName: 'loglevel',
    useLevelLabels: true,
    customLevels: uppercasePinoLevels,
    ...opts,
  }
  return opts?.destination ? pino(pinoOpts, opts?.destination) : pino(pinoOpts)
}

export const createExitListener = pino.final

export interface LoggerOptions extends pino.LoggerOptions {
  destination?: pino.DestinationStream
}

export { Logger }

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

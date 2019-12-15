import * as os from 'os'
import pino, { Logger } from 'pino'
import { iso8601WithLocalOffset } from './utils/date_utils'

export function createLogger(
  type: 'application' | 'access',
  config: LoggerConfig,
): Logger {
  const baseDefaults = {
    log_type: type,
    application_type: 'service',
    service: config.serviceName,
    host: os.hostname(),
  }
  const pinoOpts: pino.LoggerOptions = {
    base: config.base ? { ...baseDefaults, ...config.base } : baseDefaults,
    timestamp: epochTimeAndIso8601WithLocalOffset,
    changeLevelName: 'loglevel',
    useLevelLabels: true,
    customLevels: uppercasePinoLevels,
    ...config,
  }
  return config.destination
    ? pino(pinoOpts, config.destination)
    : pino(pinoOpts)
}

export const createExitListener = pino.final

export interface LoggerConfig extends pino.LoggerOptions {
  serviceName: string
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

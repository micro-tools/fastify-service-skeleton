import pino from 'pino'
import { ServiceSkeletonOptions } from '../skeleton'
import { createRootLogger, RootLogger } from './root_logger'
import { Logger } from './logging.types'
import fastify from 'fastify'
import { isOptionEnabled } from '../utils/options'

export function createLoggers(
  serviceName: string,
  loggingOpts: ServiceSkeletonOptions['logging'],
): { rootLogger: RootLogger; appLogger: Logger } {
  const rootLogger = createRootLogger(serviceName, loggingOpts || undefined)
  const appLogger = rootLogger.child({ log_type: 'application' })
  return { rootLogger, appLogger }
}

export function isAppLoggerEnabled(
  loggingOpts: ServiceSkeletonOptions['logging'],
): boolean {
  return loggingOpts !== false && loggingOpts?.appLogger !== false
}

export function checkLoggingOptionsPlausibility(
  appLogger: Logger,
  opts: ServiceSkeletonOptions,
  finalFastifyOpts: fastify.ServerOptions,
): void {
  if (
    (opts.fastify as fastify.ServerOptions | undefined)?.logger !== undefined
  ) {
    appLogger.warn(
      "You have provided fastify.logger options, but they will be ignored. Use the skeleton's logger options instead.",
    )
  }

  if (
    finalFastifyOpts.disableRequestLogging !== true &&
    isOptionEnabled(opts.plugins?.requestLogging, opts.enablePluginsByDefault)
  ) {
    appLogger.warn(
      "You have enabled fastify's default request logging in addition to the requestLogging plugin.",
    )
  }
}

export const createExitListener = pino.final

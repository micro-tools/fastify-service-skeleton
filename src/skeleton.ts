import fastify from 'fastify'
import fastifySensible from 'fastify-sensible'
import underPressure from 'under-pressure'
import { createLogger, Logger, LoggerConfig } from './logging/logger'
import { orderlyExitProcess } from './orderly_exit_process'
import healthCheck, { HealthCheckOptions } from './health_check'
import metrics, { MetricsOptions } from './metrics'

export function createServiceSkeleton(
  opts: ServiceSkeletonOptions,
): fastify.FastifyInstance {
  const logger = createLogger(
    'application',
    opts.logger
      ? { ...opts.logger, serviceName: opts.serviceName }
      : { serviceName: opts.serviceName },
  )
  const app = fastify(adaptFastifyOptions(logger, opts.fastify))
  app.decorate('name', opts.serviceName)
  // Enable all plugins unless explicitly disabled via `false`
  if (opts.plugins !== false) {
    if (opts.plugins?.orderlyExitProcess !== false) {
      orderlyExitProcess(logger)
    }
    if (opts.plugins?.metrics !== false) {
      app.register(metrics, opts.plugins?.metrics)
    }
    if (opts.plugins?.healthCheck !== false) {
      app.register(healthCheck, opts.plugins?.healthCheck)
    }
    if (opts.plugins?.sensible !== false) {
      app.register(fastifySensible)
    }
    if (opts.plugins?.underPressure !== false) {
      app.register(underPressure, opts.plugins?.underPressure)
    }
  }
  return app
}

function adaptFastifyOptions(
  logger: Logger,
  opts: fastify.ServerOptions | undefined,
): fastify.ServerOptions {
  const defaults: fastify.ServerOptions = {
    disableRequestLogging: true,
  }
  return {
    ...defaults,
    ...opts,
    logger, // override logger
  }
}

export interface ServiceSkeletonOptions {
  serviceName: string
  fastify?: fastify.ServerOptions
  logger?: LoggerConfig
  plugins?:
    | {
        metrics?: MetricsOptions | false
        orderlyExitProcess?: boolean
        healthCheck?: HealthCheckOptions | false
        sensible?: boolean
        underPressure?: underPressure.UnderPressureOptions | false
      }
    | false
}

declare module 'fastify' {
  interface FastifyInstance {
    name: string
  }
}

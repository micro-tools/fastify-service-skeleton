import fastify from 'fastify'
import fastifySensible from 'fastify-sensible'
import underPressure from 'under-pressure'
import { createLogger, Logger, LoggerOptions } from './logger/logger'
import { orderlyExitProcess } from './orderly_exit_process'
import { healthCheckPlugin, HealthCheckOptions } from './health_check'
import { metricsPlugin, MetricsOptions } from './metrics'
import { httpClientPlugin, HttpClientOptions } from './http_client'
import {
  CorrelationIdOptions,
  correlationIdPlugin,
} from './correlation_id/correlation_id'
import {
  RequestLoggingOptions,
  requestLoggingPlugin,
} from './request_logging/request_logging'
import { serviceNamePlugin } from './service_name/service_name'

export function createServiceSkeleton(
  opts: ServiceSkeletonOptions,
): fastify.FastifyInstance {
  const logger = createLogger(opts.serviceName, 'application', opts.logger)
  const app = fastify(adaptFastifyOptions(logger, opts.fastify))
  // Enable all plugins unless explicitly disabled via `false`
  if (opts.plugins !== false) {
    app.register(serviceNamePlugin, opts)
    if (opts.plugins?.orderlyExitProcess !== false) {
      orderlyExitProcess(logger)
    }
    if (opts.plugins?.healthCheck !== false) {
      app.register(healthCheckPlugin, opts.plugins?.healthCheck)
    }
    if (opts.plugins?.correlationId !== false) {
      app.register(correlationIdPlugin, opts.plugins?.correlationId)
    }
    if (opts.plugins?.requestLogging !== false) {
      app.register(requestLoggingPlugin, opts.plugins?.requestLogging)
    }
    if (opts.plugins?.metrics !== false) {
      app.register(metricsPlugin, opts.plugins?.metrics)
    }
    if (opts.plugins?.httpClient !== false) {
      app.register(httpClientPlugin, opts.plugins?.httpClient)
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
  logger?: LoggerOptions
  plugins?:
    | {
        orderlyExitProcess?: boolean
        healthCheck?: HealthCheckOptions | false
        correlationId?: CorrelationIdOptions | false
        requestLogging?: RequestLoggingOptions | false
        metrics?: MetricsOptions | false
        httpClient?: HttpClientOptions | false
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

import http from "http"
import fastify, { FastifyInstance, FastifyServerOptions } from "fastify"
import merge from "lodash.merge"
import fastifySensible from "fastify-sensible"
import underPressure from "under-pressure"
import hyperid from "hyperid"
import {
  createLoggers,
  checkLoggingOptionsPlausibility,
} from "./logging/logging"
import { Logger, LoggingOptions } from "./logging/logging.types"
import { RootLogger } from "./logging/root_logger"
import { healthCheckPlugin, HealthCheckOptions } from "./health_check"
import { metricsPlugin, MetricsOptions } from "./metrics"
import { httpClientPlugin, HttpClientPluginOptions } from "./http_client"
import { CorrelationIdOptions, correlationIdPlugin } from "./correlation_id"
import {
  RequestLoggingOptions,
  requestLoggingPlugin,
} from "./logging/request_logging_plugin"
import { serviceMetadata } from "./service_metadata"
import { shutdownPlugin, ShutdownPluginOpts } from "./shutdown"
import {
  createIsOptionEnabled,
  isOptionEnabled,
  Enableable,
} from "./utils/options"

export function createServiceSkeleton(
  opts: ServiceSkeletonOptions
): FastifyInstance<http.Server> {
  const { rootLogger, appLogger } = createLoggers(
    opts.serviceName,
    opts.logging
  )
  const finalFastifyOpts = adaptFastifyOptions(
    appLogger,
    opts.fastify,
    opts.logging
  )
  checkLoggingOptionsPlausibility(appLogger, opts, finalFastifyOpts)
  const app = fastify<http.Server>(finalFastifyOpts)
  app.decorate("rootLogger", rootLogger)
  void app.register(serviceMetadata, { serviceName: opts.serviceName })

  // Enable all plugins unless explicitly disabled by default,
  // but this behaviour can be modified via `enablePluginsByDefault`
  const isPluginEnabled = createIsOptionEnabled(opts.enablePluginsByDefault)
  if (isPluginEnabled(opts.plugins?.healthCheck)) {
    void app.register(healthCheckPlugin, opts.plugins?.healthCheck)
  }
  if (isPluginEnabled(opts.plugins?.correlationId)) {
    void app.register(correlationIdPlugin, opts.plugins?.correlationId)
  }
  if (isPluginEnabled(opts.plugins?.requestLogging)) {
    void app.register(requestLoggingPlugin, {
      requestIdLogLabel: finalFastifyOpts.requestIdLogLabel,
      ...opts.plugins?.requestLogging,
    })
  }
  if (isPluginEnabled(opts.plugins?.metrics)) {
    void app.register(metricsPlugin, opts.plugins?.metrics)
  }
  if (isPluginEnabled(opts.plugins?.httpClient)) {
    void app.register(httpClientPlugin, opts.plugins?.httpClient)
  }
  if (isPluginEnabled(opts.plugins?.sensible)) {
    void app.register(fastifySensible)
  }
  if (isPluginEnabled(opts.plugins?.shutdown)) {
    void app.register(shutdownPlugin, opts.plugins?.shutdown)
  }
  if (isPluginEnabled(opts.plugins?.underPressure)) {
    void app.register(underPressure, opts.plugins?.underPressure)
  }
  return app
}

function adaptFastifyOptions(
  appLogger: Logger,
  fastifyOpts: ServiceSkeletonOptions["fastify"],
  loggingOpts: ServiceSkeletonOptions["logging"]
): FastifyServerOptions {
  const defaults: FastifyServerOptions = {
    disableRequestLogging: true,
    requestIdLogLabel: "request_id",
    genReqId: hyperid({ urlSafe: true }),
  }
  const overrides = {
    logger: isOptionEnabled(loggingOpts, true) ? appLogger : false,
  }
  return merge(defaults, fastifyOpts, overrides)
}

export interface ServiceSkeletonOptions {
  serviceName: string
  fastify?: Omit<FastifyServerOptions, "logger">
  logging?: Enableable<LoggingOptions>
  enablePluginsByDefault?: boolean
  plugins?: {
    healthCheck?: Enableable<HealthCheckOptions>
    correlationId?: Enableable<CorrelationIdOptions>
    requestLogging?: Enableable<RequestLoggingOptions>
    metrics?: Enableable<MetricsOptions>
    httpClient?: Enableable<HttpClientPluginOptions>
    sensible?: boolean
    shutdown?: Enableable<ShutdownPluginOpts>
    underPressure?: Enableable<underPressure.UnderPressureOptions>
  }
}

declare module "fastify" {
  interface FastifyInstance {
    rootLogger: RootLogger
  }
}

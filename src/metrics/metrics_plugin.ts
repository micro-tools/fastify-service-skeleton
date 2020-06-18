import promClient from "prom-client"
import fastifyPlugin from "fastify-plugin"
import { requestMetricsPlugin, RequestMetricsOptions } from "./request_metrics"
import { isOptionEnabled, Enableable } from "../utils/options"
import {
  prometheusMeterPlugin,
  PrometheusMeterOptions,
} from "./prometheus_meter_plugin"

export const metricsPlugin = fastifyPlugin(
  async (app, opts: MetricsOptions) => {
    // Use a dedicated local register instead of the global one
    const register = opts.register || new promClient.Registry()

    app.register(prometheusMeterPlugin, {
      // Use `register` by default, but may me overriden by specific options
      defaultRegisters: [register],
      ...opts.prometheusMeter,
    })
    if (isOptionEnabled(opts.defaultMetrics)) {
      // Use `register` by default, but may me overriden by specific options
      promClient.collectDefaultMetrics({ register, ...opts.defaultMetrics })
    }
    if (isOptionEnabled(opts.requestMetrics)) {
      app.register(requestMetricsPlugin, opts.requestMetrics)
    }

    app.route({
      method: "GET",
      url: opts.endpointPath || "/admin/metrics",
      config: { accessLogLevel: "DEBUG" },
      handler(_request, reply) {
        reply
          .type("text/plain; version=0.0.4")
          .send(promClient.register.metrics())
      },
    })
  },
  {
    name: "metrics",
    fastify: "2.x",
  }
)

export interface MetricsOptions {
  endpointPath?: string
  register?: promClient.Registry
  prometheusMeter?: PrometheusMeterOptions
  defaultMetrics?: Enableable<promClient.DefaultMetricsCollectorConfiguration>
  requestMetrics?: Enableable<RequestMetricsOptions>
}

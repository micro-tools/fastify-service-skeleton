import promClient from "prom-client"
import fastifyPlugin from "fastify-plugin"
import { requestMetricsPlugin, RequestMetricsOptions } from "./request_metrics"
import { isOptionEnabled, Enableable } from "../utils/options"
import {
  prometheusMeterPlugin,
  PrometheusMeterOptions,
} from "./prometheus_meter_plugin"

export const metricsPlugin = fastifyPlugin(
  async (app, opts: Partial<MetricsOptions>) => {
    app.register(prometheusMeterPlugin, opts.prometheusMeter)
    if (isOptionEnabled(opts.defaultMetrics)) {
      promClient.collectDefaultMetrics(opts.defaultMetrics)
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
  prometheusMeter?: PrometheusMeterOptions
  defaultMetrics?: Enableable<promClient.DefaultMetricsCollectorConfiguration>
  requestMetrics?: Enableable<RequestMetricsOptions>
}

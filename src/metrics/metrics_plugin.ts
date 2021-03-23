import promClient from "prom-client"
import fastifyPlugin from "fastify-plugin"
import { requestMetricsPlugin, RequestMetricsOptions } from "./request_metrics"
import { isOptionEnabled, Enableable } from "../utils/options"
import {
  prometheusMeterPlugin,
  PrometheusMeterOptions,
} from "./prometheus_meter"

export const metricsPlugin = fastifyPlugin(
  // eslint-disable-next-line @typescript-eslint/require-await
  async (app, opts: MetricsOptions) => {
    // Use a dedicated local register instead of the global one
    const register = opts.register || new promClient.Registry()

    void app.register(prometheusMeterPlugin, {
      // Use `register` by default, but may me overriden by specific options
      defaultRegisters: [register],
      ...opts.prometheusMeter,
    })
    if (isOptionEnabled(opts.defaultMetrics)) {
      // Use `register` by default, but may me overriden by specific options
      promClient.collectDefaultMetrics({ register, ...opts.defaultMetrics })
    }
    if (isOptionEnabled(opts.requestMetrics)) {
      void app.register(requestMetricsPlugin, opts.requestMetrics)
    }

    app.route({
      method: "GET",
      url: opts.endpointPath || "/admin/metrics",
      config: { accessLogLevel: "DEBUG" },
      async handler(_request, reply) {
        void reply
          .type("text/plain; version=0.0.4")
          .send(await register.metrics())
      },
    })
  },
  {
    name: "metrics",
    fastify: "3.x",
  }
)

export interface MetricsOptions {
  endpointPath?: string
  register?: promClient.Registry
  prometheusMeter?: PrometheusMeterOptions
  defaultMetrics?: Enableable<promClient.DefaultMetricsCollectorConfiguration>
  requestMetrics?: Enableable<RequestMetricsOptions>
}

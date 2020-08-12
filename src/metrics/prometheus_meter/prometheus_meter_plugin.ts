import * as promClient from "prom-client"
import fastifyPlugin from "fastify-plugin"
import { createPrometheusMeter } from "./prometheus_meter_factory"
import type { PrometheusMeter } from "./prometheus_meter_interface"

export const prometheusMeterPlugin = fastifyPlugin(
  async function prometheusMeterPlugin(app, opts: PrometheusMeterOptions) {
    // Use a dedicated local register instead of the global one
    const defaultRegisters = opts.defaultRegisters || [
      new promClient.Registry(),
    ]
    app.decorate(
      "prometheusMeter",
      createPrometheusMeter(
        defaultRegisters,
        opts.Counter,
        opts.Gauge,
        opts.Histogram,
        opts.Summary
      )
    )
  },
  {
    name: "prometheus-meter",
    fastify: "3.x",
  }
)

export interface PrometheusMeterOptions {
  defaultRegisters: promClient.Registry[]
  Counter?: typeof promClient.Counter
  Gauge?: typeof promClient.Gauge
  Histogram?: typeof promClient.Histogram
  Summary?: typeof promClient.Summary
}

declare module "fastify" {
  interface FastifyInstance {
    prometheusMeter: PrometheusMeter
  }
}

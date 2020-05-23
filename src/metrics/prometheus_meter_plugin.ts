import * as promClient from "prom-client"
import fastifyPlugin from "fastify-plugin"
import type { PrometheusMeter } from "./prometheus_meter_interface"

export const prometheusMeterPlugin = fastifyPlugin(
  async (app, opts: Partial<PrometheusMeterOptions>) => {
    app.decorate(
      "prometheusMeter",
      createPrometheusMeter(
        opts.defaultRegisters,
        opts.Counter,
        opts.Gauge,
        opts.Histogram,
        opts.Summary
      )
    )
  },
  {
    name: "prometheus-meter",
    fastify: "2.x",
  }
)

export function createPrometheusMeter(
  defaultRegisters: promClient.Registry[] = [promClient.register],
  Counter = promClient.Counter,
  Gauge = promClient.Gauge,
  Histogram = promClient.Histogram,
  Summary = promClient.Summary
): PrometheusMeter {
  return {
    createCounter<Labels extends string>(
      config: promClient.CounterConfiguration<Labels>
    ): promClient.Counter<Labels> {
      return new Counter<Labels>({ registers: defaultRegisters, ...config })
    },

    createGauge<Labels extends string>(
      config: promClient.GaugeConfiguration<Labels>
    ): promClient.Gauge<Labels> {
      return new Gauge<Labels>({ registers: defaultRegisters, ...config })
    },

    createHistogram<Labels extends string>(
      config: promClient.HistogramConfiguration<Labels>
    ): promClient.Histogram<Labels> {
      return new Histogram<Labels>({ registers: defaultRegisters, ...config })
    },

    createSummary<Labels extends string>(
      config: promClient.SummaryConfiguration<Labels>
    ): promClient.Summary<Labels> {
      return new Summary<Labels>({ registers: defaultRegisters, ...config })
    },
  }
}

export interface PrometheusMeterOptions {
  defaultRegisters?: promClient.Registry[]
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

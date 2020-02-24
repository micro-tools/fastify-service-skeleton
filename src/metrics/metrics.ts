import promClient from 'prom-client'
import fastifyPlugin from 'fastify-plugin'
import { Plugin } from '../plugin'
import { collectRequestMetrics } from './request_metrics'
import { isOptionEnabled, Enableable } from '../utils/options'

export const metricsPlugin: Plugin<MetricsOptions> = fastifyPlugin(
  async (app, opts) => {
    if (isOptionEnabled(opts.defaultMetrics)) {
      promClient.collectDefaultMetrics(opts.defaultMetrics)
    }
    if (isOptionEnabled(opts?.requestMetrics)) {
      collectRequestMetrics(app)
    }

    app.route({
      method: 'GET',
      url: opts?.url || '/admin/metrics',
      config: { accessLogLevel: 'DEBUG' },
      handler(request, reply) {
        reply
          .type('text/plain; version=0.0.4')
          .send(promClient.register.metrics())
      },
    })
  },
)

export interface MetricsOptions {
  url?: string
  defaultMetrics?: Enableable<promClient.DefaultMetricsCollectorConfiguration>
  requestMetrics?: boolean
}

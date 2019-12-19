import promClient from 'prom-client'
import fastifyPlugin from 'fastify-plugin'
import { Plugin } from '../plugin'
import { defaultMetricsPlugin, DefaultMetricsOptions } from './default_metrics'
import { requestMetricsPlugin } from './request_metrics'

export const metricsPlugin: Plugin<MetricsOptions> = fastifyPlugin(
  async (app, opts) => {
    if (opts?.defaultMetrics !== false) {
      app.register(defaultMetricsPlugin)
    }
    if (opts?.requestMetrics) {
      app.register(requestMetricsPlugin)
    }

    app.route({
      method: 'GET',
      url: opts?.url || '/admin/metrics',
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
  defaultMetrics?: DefaultMetricsOptions
  requestMetrics?: boolean
}

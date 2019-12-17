import promClient from 'prom-client'
import fastifyPlugin from 'fastify-plugin'
import { createPlugin } from '../plugin'
import defaultMetrics, { DefaultMetricsOptions } from './default_metrics'
import requestMetrics from './request_metrics'

export default createPlugin<MetricsOptions>(
  fastifyPlugin(async (app, opts) => {
    if (opts?.defaultMetrics !== false) {
      app.register(defaultMetrics)
    }
    if (opts?.requestMetrics) {
      app.register(requestMetrics)
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
  }),
)

export interface MetricsOptions {
  url?: string
  defaultMetrics?: DefaultMetricsOptions
  requestMetrics?: boolean
}

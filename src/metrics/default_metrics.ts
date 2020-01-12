import { FastifyInstance } from 'fastify'
import promClient from 'prom-client'

export function collectDefaultMetrics(
  app: FastifyInstance,
  opts?: DefaultMetricsOptions,
): void {
  const collectInterval: NodeJS.Timeout = promClient.collectDefaultMetrics(opts)

  app.addHook('onClose', (app, done) => {
    if (collectInterval) {
      clearInterval(collectInterval)
    }
    done()
  })
}

export type DefaultMetricsOptions = promClient.DefaultMetricsCollectorConfiguration

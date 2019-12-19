import promClient from 'prom-client'
import { Plugin } from '../plugin'

export const defaultMetricsPlugin: Plugin<DefaultMetricsOptions> = async (
  app,
  opts,
) => {
  const collectInterval: NodeJS.Timeout = promClient.collectDefaultMetrics(opts)

  app.addHook('onClose', (app, done) => {
    if (collectInterval) {
      clearInterval(collectInterval)
    }
    done()
  })
}

export type DefaultMetricsOptions = promClient.DefaultMetricsCollectorConfiguration

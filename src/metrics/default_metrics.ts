import promClient from 'prom-client'
import { createPlugin } from '../plugin'

export default createPlugin<DefaultMetricsOptions>(async (app, opts) => {
  const defaultMetricsCollectInterval: NodeJS.Timeout = promClient.collectDefaultMetrics(
    opts,
  )

  app.addHook('onClose', (app, done) => {
    if (defaultMetricsCollectInterval) {
      clearInterval(defaultMetricsCollectInterval)
    }
    done()
  })
})

export type DefaultMetricsOptions = promClient.DefaultMetricsCollectorConfiguration

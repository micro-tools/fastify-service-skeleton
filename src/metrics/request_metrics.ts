import promClient from 'prom-client'
import { createPlugin } from '../plugin'

export default createPlugin(async app => {
  const requestHistogram = new promClient.Histogram({
    name: 'http_request_duration_seconds',
    help:
      'HTTP request durations in seconds, labeled by status_code, method and path.',
    labelNames: ['status_code', 'method', 'path'],
  })

  app.addHook('onResponse', function(request, reply, done) {
    requestHistogram.observe(
      {
        method: request.req.method || 'UNKNOWN',
        path: reply.context.config.url || request.req.url,
        status_code: reply.res.statusCode,
      },
      reply.getResponseTime(),
    )
    done()
  })
})

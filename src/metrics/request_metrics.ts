import { FastifyInstance } from 'fastify'
import promClient from 'prom-client'

export function collectRequestMetrics(
  app: FastifyInstance,
): promClient.Histogram {
  const requestHistogram = new promClient.Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP server response time in seconds',
    labelNames: ['status_code', 'method', 'path'],
  })

  app.addHook('onResponse', (request, reply, done) => {
    requestHistogram.observe(
      {
        method: request.req.method || 'unknown',
        path: reply.context.config.url || 'unknown',
        status_code: reply.res.statusCode,
      },
      reply.getResponseTime() / 1000,
    )
    done()
  })
  return requestHistogram
}

function removeQueryStringFromUrlPath(url: string): string {
  const querySeparatorIndex = url.indexOf('?')
  return querySeparatorIndex > -1 ? url.slice(0, querySeparatorIndex) : url
}

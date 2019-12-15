import { IncomingHttpHeaders } from 'http'
import fastifyPlugin from 'fastify-plugin'
import { createPlugin } from '../plugin'
import { iso8601WithLocalOffset } from './utils/date_utils'
import { createLogger, LoggerConfig } from './logger'
import correlationIdPlugin from './correlation_id'

export default createPlugin<LoggerConfig>(
  fastifyPlugin(async (app, opts) => {
    app.register(correlationIdPlugin)

    const requestLogger = createLogger('application', opts)
    const accessLogger = createLogger('access', opts)

    app.addHook('onRequest', (request, reply, done) => {
      request.receivedAt = new Date()
      request.log = requestLogger.child({
        request_id: request.id,
        'correlation-id': request.correlationId,
      })
      done()
    })

    app.addHook('onResponse', (request, reply, done) => {
      accessLogger.info({
        remote_address: request.ip,
        response_time: Math.round(reply.getResponseTime()),
        received_at: iso8601WithLocalOffset(request.receivedAt),
        request_id: request.id,
        'correlation-id': request.correlationId,
      })
      done()
    })
  }),
)

function extractOriginalIp(headers: IncomingHttpHeaders): string | null {
  const header = headers['true-client-ip'] || headers['x-forwarded-for'] || null
  const ips = Array.isArray(header) ? header[0] : header
  return typeof ips === 'string' ? ips.split(',')[0].trim() : null
}

declare module 'fastify' {
  interface FastifyRequest {
    receivedAt: Date
  }
}

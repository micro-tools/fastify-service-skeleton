import { IncomingHttpHeaders } from 'http'
import fastifyPlugin from 'fastify-plugin'
import { Plugin } from '../plugin'
import { iso8601WithLocalOffset } from './utils/date_utils'
import { createLogger, LoggerConfig } from './logger'
import { correlationIdPlugin } from './correlation_id'
import { assertIsNotUndefined, assert } from '../utils/assert'

export const requestLoggingPlugin: Plugin<LoggerConfig> = fastifyPlugin(
  async (app, loggerConfig) => {
    assertIsNotUndefined(loggerConfig, 'loggerConfig')

    app.register(correlationIdPlugin)

    const accessLogger = createLogger('access', loggerConfig)

    app.addHook('onRequest', (request, reply, done) => {
      // add receivedAt so we can log it on response
      request.receivedAt = new Date()
      // override request and reply logger with a request specific one if it has a child method
      assert(request.log === reply.log)
      if (typeof request.log.child === 'function') {
        request.log = reply.log = (request.log as import('pino').Logger).child({
          request_id: request.id,
          'correlation-id': request.correlationId,
        })
      }
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
  },
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

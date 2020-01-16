import { IncomingHttpHeaders } from 'http'
import fastifyPlugin from 'fastify-plugin'
import { Plugin } from '../plugin'
import { iso8601WithLocalOffset } from '../utils/date_utils'
import { LoggerOptions } from './logging.types'

export const requestLoggingPlugin: Plugin<RequestLoggingOptions> = fastifyPlugin(
  async function requestLoggingPlugin(
    app,
    opts: Partial<RequestLoggingOptions>,
  ) {
    const requestIdLogLabel = opts.requestIdLogLabel || 'request_id'

    app.decorateRequest('receivedAt', null)
    app.addHook('onRequest', (request, reply, done) => {
      // add receivedAt to requests so we can log it on response
      request.receivedAt = new Date()
      // override request and reply logger with a request specific one if it has a child method
      // assert(request.log === reply.log)
      if (typeof request.log.child === 'function') {
        request.log = reply.log = (request.log as import('pino').Logger).child({
          'correlation-id': request.correlationId,
        })
      }
      done()
    })

    // write access logs
    const accessLogger = app.rootLogger.child({ log_type: 'access' })
    app.addHook('onResponse', function(request, reply, done) {
      const { url, queryString } = separateQueryStringFromUrl(request.raw.url!)
      accessLogger.info({
        [requestIdLogLabel]: request.id,
        remote_address: request.ip,
        response_time: Math.round(reply.getResponseTime()),
        received_at: iso8601WithLocalOffset(request.receivedAt),
        'correlation-id': request.correlationId,
        request_method: request.raw.method,
        uri: url,
        query_string: queryString,
        status: reply.statusCode,
        user_agent: request.headers['user-agent'] || '',
      })
      done()
    })
  },
  { decorators: { fastify: ['rootLogger'], request: ['correlationId'] } },
)

function separateQueryStringFromUrl(
  url: string,
): { url: string; queryString: string } {
  const querySeparatorIndex = url.indexOf('?')
  if (querySeparatorIndex > -1) {
    return {
      url: url.slice(0, querySeparatorIndex),
      queryString: url.slice(querySeparatorIndex),
    }
  } else {
    return { url, queryString: '' }
  }
}

function extractOriginalIp(headers: IncomingHttpHeaders): string | null {
  const header = headers['true-client-ip'] || headers['x-forwarded-for'] || null
  const ips = Array.isArray(header) ? header[0] : header
  return typeof ips === 'string' ? ips.split(',')[0].trim() : null
}

export interface RequestLoggingOptions {
  accessLogger?: LoggerOptions
  requestIdLogLabel?: string
}

declare module 'fastify' {
  interface FastifyRequest {
    receivedAt: Date
  }
}

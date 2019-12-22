import uuidV4 from 'uuid/v4'
import fastifyPlugin from 'fastify-plugin'
import { Plugin } from '../plugin'

export const correlationIdPlugin: Plugin<CorrelationIdOptions> = fastifyPlugin(
  async function correlationIdPlugin(app, opts) {
    const header = opts.header || 'correlation-id'
    app.decorateRequest('correlationId', '')
    app.addHook('onRequest', (request, reply, done) => {
      request.correlationId = request.headers[header] || uuidV4()
      done()
    })
  },
)

export interface CorrelationIdOptions {
  header?: string
}

declare module 'fastify' {
  interface FastifyRequest {
    correlationId: string
  }
}

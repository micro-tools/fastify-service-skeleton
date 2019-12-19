import uuidV4 from 'uuid/v4'
import fastifyPlugin from 'fastify-plugin'
import { Plugin } from '../plugin'

export const correlationIdPlugin: Plugin<CorrelationIdOptions> = fastifyPlugin(
  async (app, opts) => {
    const header = opts.header || 'correlation-id'
    app.addHook('onRequest', (request, reply, done) => {
      app.decorateRequest('correlationId', request.headers[header] || uuidV4())
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

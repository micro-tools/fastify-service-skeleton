import uuid from 'uuid'
import fastifyPlugin from 'fastify-plugin'
import { createPlugin } from '../plugin'

export default createPlugin(
  fastifyPlugin(async app => {
    app.addHook('onRequest', (request, reply, done) => {
      const correlationId = request.headers['correlation-id'] || uuid.v4()
      app.decorateRequest('correlationId', correlationId)
      done()
    })
  }),
)

declare module 'fastify' {
  interface FastifyRequest {
    correlationId: string
  }
}

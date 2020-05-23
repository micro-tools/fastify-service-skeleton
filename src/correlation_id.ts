import { v4 as uuidV4 } from "uuid"
import fastifyPlugin from "fastify-plugin"

export const correlationIdPlugin = fastifyPlugin(
  async function correlationIdPlugin(app, opts: Partial<CorrelationIdOptions>) {
    const header = opts.header || "correlation-id"
    app.decorateRequest("correlationId", "")
    app.addHook("onRequest", (request, reply, done) => {
      const correlationId = request.headers[header] || uuidV4()
      request.correlationId = correlationId
      reply.header("correlation-id", correlationId)
      done()
    })
  },
  {
    name: "correlation-id",
    fastify: "2.x",
  }
)

export interface CorrelationIdOptions {
  header?: string
}

declare module "fastify" {
  interface FastifyRequest {
    correlationId: string
  }
}

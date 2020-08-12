import { v4 as uuidV4 } from "uuid"
import fastifyPlugin from "fastify-plugin"

export const correlationIdPlugin = fastifyPlugin(
  async function correlationIdPlugin(app, opts: CorrelationIdOptions) {
    const requestHeader = opts.requestHeader || "correlation-id"
    const responseHeader = opts.responseHeader || "Correlation-Id"

    app.decorateRequest("correlationId", "")
    app.addHook("onRequest", (request, reply, done) => {
      const headerValue = request.headers[requestHeader]
      if (!headerValue) {
        // Generate an uuid v4 if header is falsy
        request.correlationId = uuidV4()
      } else if (typeof headerValue === "string") {
        request.correlationId = headerValue
      } else if (Array.isArray(headerValue)) {
        // Take the first value if we received multiple headers
        request.correlationId = headerValue[0]
      }
      // Add the resulting correlationId as response header
      reply.header(responseHeader, request.correlationId)
      done()
    })
  },
  {
    name: "correlation-id",
    fastify: "3.x",
  }
)

export interface CorrelationIdOptions {
  requestHeader?: string
  responseHeader?: string
}

declare module "fastify" {
  interface FastifyRequest {
    correlationId: string
  }
}

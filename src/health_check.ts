import { FastifyInstance } from "fastify"

export async function healthCheckPlugin(
  app: FastifyInstance,
  opts: Partial<HealthCheckOptions>
): Promise<void> {
  app.route({
    method: "GET",
    url: opts.endpointPath || "/admin/healthcheck",
    config: { accessLogLevel: "DEBUG" },
    handler(_request, reply) {
      reply.code(200).send()
    },
  })
}

export interface HealthCheckOptions {
  endpointPath?: string
}

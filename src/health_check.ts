import { FastifyInstance } from "fastify"

// eslint-disable-next-line @typescript-eslint/require-await
export async function healthCheckPlugin(
  app: FastifyInstance,
  opts: HealthCheckOptions
): Promise<void> {
  app.route({
    method: "GET",
    url: opts.endpointPath || "/admin/healthcheck",
    config: { accessLogLevel: "DEBUG" },
    handler(_request, reply) {
      void reply.code(200).send()
    },
  })
}

export interface HealthCheckOptions {
  endpointPath?: string
}

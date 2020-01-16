import { Plugin } from './plugin'

export const healthCheckPlugin: Plugin<HealthCheckOptions> = async (
  app,
  opts,
) => {
  app.route({
    method: 'GET',
    url: opts?.url || '/admin/healthcheck',
    config: { accessLogLevel: 'DEBUG' },
    handler(request, reply) {
      reply.code(200).send()
    },
  })
}

export interface HealthCheckOptions {
  url?: string
}

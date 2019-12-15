import { createPlugin } from './plugin'

export default createPlugin<HealthCheckOptions>(async (app, opts) => {
  app.route({
    method: 'GET',
    url: opts.url || '/admin/healthcheck',
    handler(request, reply) {
      reply.code(200).send()
    },
  })
})

export interface HealthCheckOptions {
  url?: string
}

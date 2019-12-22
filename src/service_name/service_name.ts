import fastifyPlugin from 'fastify-plugin'
import { Plugin } from '../plugin'
import { assertIsNonEmptyObject } from '../utils/assert'

export const serviceNamePlugin: Plugin<ServiceNameOptions> = fastifyPlugin(
  async function serviceNamePlugin(app, opts: ServiceNameOptions | {}) {
    assertIsNonEmptyObject<ServiceNameOptions>(opts)
    app.decorate('serviceName', opts.serviceName)
  },
)

export interface ServiceNameOptions {
  serviceName: string
}

declare module 'fastify' {
  interface FastifyInstance {
    serviceName: string
  }
}

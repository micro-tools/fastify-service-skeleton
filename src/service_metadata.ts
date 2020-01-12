import fastifyPlugin from 'fastify-plugin'
import { Plugin } from './plugin'
import { assertIsNonEmptyObject } from './utils/assert'

export const serviceMetadata: Plugin<ServiceMetadataOptions> = fastifyPlugin(
  async function serviceNamePlugin(app, opts: ServiceMetadataOptions | {}) {
    assertIsNonEmptyObject<ServiceMetadataOptions>(opts)
    app.decorate('serviceName', opts.serviceName)
  },
)

export interface ServiceMetadataOptions {
  serviceName: string
}

declare module 'fastify' {
  interface FastifyInstance {
    serviceName: string
  }
}

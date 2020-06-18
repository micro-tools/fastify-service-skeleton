import fastifyPlugin from "fastify-plugin"
import { assertIsNonEmptyObject } from "./utils/assert"

export const serviceMetadata = fastifyPlugin(
  async function serviceMetadataPlugin(app, opts: ServiceMetadataOptions) {
    assertIsNonEmptyObject<ServiceMetadataOptions>(opts)
    app.decorate("serviceName", opts.serviceName)
  },
  {
    name: "service-metadata",
    fastify: "2.x",
  }
)

export interface ServiceMetadataOptions {
  serviceName: string
}

declare module "fastify" {
  interface FastifyInstance {
    serviceName: string
  }
}

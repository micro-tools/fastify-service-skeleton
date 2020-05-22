import fastify from "fastify"

declare module "fastify" {
  interface Logger {
    [key: string]: unknown // allow logger to have further unknown properties
  }

  interface FastifyReply<HttpResponse> {
    log: fastify.Logger // log is missing in original declaration
  }
}

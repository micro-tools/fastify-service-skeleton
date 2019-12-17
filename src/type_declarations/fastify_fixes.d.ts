import fastify from 'fastify'

declare module 'fastify' {
  interface Logger {
    [key: string]: any // allow logger to have further unknown properties
  }

  interface FastifyReply<HttpResponse> {
    log: Logger // log is missing in original declaration
  }
}

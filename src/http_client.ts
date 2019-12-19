import axios, { AxiosRequestConfig, AxiosInstance } from 'axios'
import { Plugin } from './plugin'
import fastifyPlugin = require('fastify-plugin')
import { assert } from './utils/assert'

export const httpClientPlugin: Plugin<HttpClientOptions> = fastifyPlugin(
  async (app, opts) => {
    const correlationIdHeader = opts.correlationIdHeader || 'Correlation-Id'

    app.addHook('onRequest', (request, reply, done) => {
      const createHttpClient: AxiosFactory = config =>
        axios.create({
          ...opts.axiosDefaults,
          ...config,
          headers: { [correlationIdHeader]: request.correlationId },
        })
      app.decorateRequest('createHttpClient', createHttpClient)
      done()
    })
  },
  { decorators: { request: ['correlationId'] } },
)

type AxiosFactory = (config?: AxiosRequestConfig) => AxiosInstance

export interface HttpClientOptions {
  axiosDefaults?: AxiosRequestConfig
  correlationIdHeader?: string
}

declare module 'fastify' {
  interface FastifyRequest {
    createHttpClient: AxiosFactory
  }
}

import axios, { AxiosRequestConfig, AxiosInstance } from 'axios'
import { Plugin } from './plugin'
import fastifyPlugin = require('fastify-plugin')

export const httpClientPlugin: Plugin<HttpClientOptions> = fastifyPlugin(
  async (app, opts) => {
    const correlationIdHeader = opts.correlationIdHeader || 'Correlation-Id'

    app.decorateRequest('createHttpClient', null, ['correlationId'])
    app.addHook('onRequest', (request, reply, done) => {
      request.createHttpClient = config =>
        axios.create({
          ...opts.axiosDefaults,
          ...config,
          headers: { [correlationIdHeader]: request.correlationId },
        })
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

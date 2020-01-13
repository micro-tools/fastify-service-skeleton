import fastifyPlugin from 'fastify-plugin'
import * as promClient from 'prom-client'
import got, {
  Options,
  Got,
  Response as GotResponse,
  NormalizedOptions,
  GeneralError,
} from 'got'
import merge from 'lodash.merge'
import { Plugin } from './plugin'
import { FastifyRequest } from 'fastify'
import { URL } from 'url'
import { Logger } from './logging/logging.types'

export const httpClientPlugin: Plugin<HttpClientPluginOptions> = fastifyPlugin(
  async (app, opts) => {
    const correlationIdHeader = opts.correlationIdHeader || 'correlation-id'
    app.decorateRequest('createHttpClient', null, ['correlationId'])
    app.addHook('onRequest', (request, reply, done) => {
      request.createHttpClient = createRequestSpecificClientFactory(
        correlationIdHeader,
        request,
      )
      done()
    })
  },
  { decorators: { request: ['correlationId'] } },
)

function createRequestSpecificClientFactory(
  correlationIdHeader: string,
  serverRequest: FastifyRequest,
  instrumentation = new HttpClientInstrumentation(serverRequest.log as Logger),
): HttpClientFactory {
  return function createRequestSpecificClient(opts?: HttpClientOptions) {
    return got.extend(
      initClientOptions(
        serverRequest.correlationId,
        correlationIdHeader,
        instrumentation,
        opts,
      ),
    )
  }
}

function initClientOptions(
  correlationId: string,
  correlationIdHeader: string,
  instrumentation: HttpClientInstrumentation,
  options?: HttpClientOptions,
): HttpClientOptions {
  const defaults: HttpClientOptions = {
    responseType: 'json',
    retry: { limit: 0 }, // do not retry by default
  }
  const enforcedOptions: HttpClientOptions = {
    headers: { [correlationIdHeader]: correlationId },
    hooks: {
      beforeRequest: [
        options => {
          instrumentation.beforeRequest(options)
        },
      ],
      afterResponse: [
        response => {
          instrumentation.receivedResponse(response)
          return response
        },
      ],
      beforeError: [
        error => {
          instrumentation.beforeError(error)
          return error
        },
      ],
      beforeRetry: [
        (options, error, retryCount) =>
          instrumentation.beforeRetry(options, error, retryCount),
      ],
      beforeRedirect: [
        (options, response) => {
          instrumentation.beforeRedirect(options, response)
        },
      ],
    },
  }
  return merge(defaults, options, enforcedOptions)
}

export class HttpClientInstrumentation {
  static requestDurations = new promClient.Histogram({
    name: 'http_client_total_request_duration_seconds',
    help: 'HTTP client total request durations.',
    labelNames: ['host', 'status_code', 'is_retry', 'from_cache'],
  })

  constructor(private readonly logger: Logger) {}

  beforeRequest(options: NormalizedOptions): void {
    this.logger.debug(
      { url: options.url, method: options.method },
      'HTTP client starts request',
    )
  }

  receivedResponse(clientResponse: HttpClientResponse): void {
    this.logger.debug(
      {
        url: clientResponse.url,
        requested_url:
          clientResponse.requestUrl !== clientResponse.url
            ? clientResponse.requestUrl
            : undefined,
        method: clientResponse.request.options.method,
        status_code: clientResponse.statusCode,
        status_message: clientResponse.statusMessage,
        retry_count: clientResponse.retryCount,
        from_cache: clientResponse.isFromCache,
        http_version: clientResponse.httpVersion,
        ip: clientResponse.ip,
        durations: clientResponse.timings.phases,
      },
      'HTTP client has received response',
    )
    if (typeof clientResponse.timings.phases.total === 'number') {
      HttpClientInstrumentation.requestDurations.observe(
        {
          host: new URL(clientResponse.url).host || 'unknown',
          status_code: clientResponse.statusCode,
          is_retry: Number(clientResponse.retryCount > 0),
          from_cache:
            typeof clientResponse.isFromCache === 'boolean'
              ? Number(clientResponse.isFromCache)
              : 'unknown',
        },
        clientResponse.timings.phases.total / 1000,
      )
    } else {
      this.logger.error(
        {
          url: clientResponse.url,
          requested_url:
            clientResponse.requestUrl !== clientResponse.url
              ? clientResponse.requestUrl
              : undefined,
          method: clientResponse.request.options.method,
        },
        'HTTP client request duration metric is missing',
      )
    }
  }

  beforeRetry(
    options: NormalizedOptions,
    error?: GeneralError,
    retryCount?: number,
  ): void {
    const retryLimit = options.retry.limit
    this.logger.debug(
      {
        url: options.url,
        method: options.method,
        retry_count: retryCount,
        retry_limit: retryLimit,
        error_name: error?.name,
        error_stack: error?.stack,
      },
      `HTTP client will retry #${retryCount} of ${retryLimit}`,
    )
  }

  beforeRedirect(
    options: NormalizedOptions,
    clientResponse: HttpClientResponse,
  ) {
    this.logger.debug(
      { url: options.url, method: options.method },
      'HTTP client request will be redirected',
    )
  }

  beforeError(error: GeneralError) {
    this.logger.error(
      {
        error_name: error.name,
        error_stack: error.stack,
      },
      `HTTP client error: ${error.message}`,
    )
  }
}

export type HttpClient = Got
export type HttpClientOptions = Options
export type HttpClientResponse = GotResponse
export type HttpClientFactory = (opts?: HttpClientOptions) => HttpClient
export interface HttpClientPluginOptions extends HttpClientOptions {
  correlationIdHeader?: string
}

declare module 'fastify' {
  interface FastifyRequest {
    createHttpClient: HttpClientFactory
  }
}

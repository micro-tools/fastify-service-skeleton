import { URL } from 'url'
import fastifyPlugin from 'fastify-plugin'
import * as promClient from 'prom-client'
import got, {
  Options,
  Got,
  Response as GotResponse,
  NormalizedOptions,
  GeneralError,
  GotError,
  HTTPError,
  ParseError,
  MaxRedirectsError,
} from 'got'
import merge from 'lodash.merge'
import { Plugin } from './plugin'
import { FastifyRequest } from 'fastify'
import { Logger } from './logging/logging.types'
import { cachedStringHasher } from './utils/cached_string_hasher'

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

  static requestErrors = new promClient.Counter({
    name: 'http_client_request_errors_total',
    help: 'HTTP client total request errors.',
    labelNames: ['host', 'error_name', 'code'],
  })

  constructor(private readonly logger: Logger) {}

  beforeRequest(options: NormalizedOptions): void {
    this.logger.debug(
      { http_client_options: createOptionsLog(options) },
      'HTTP client starts request',
    )
  }

  receivedResponse(clientResponse: HttpClientResponse): void {
    this.logger.debug(
      { http_client_response: createResponseLog(clientResponse, true) },
      'HTTP client has received response',
    )
    if (typeof clientResponse.timings.phases.total === 'number') {
      HttpClientInstrumentation.requestDurations.observe(
        {
          host: new URL(clientResponse.url).host,
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
        { http_client_response: createResponseLog(clientResponse) },
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
        retry_count: retryCount,
        retry_limit: retryLimit,
        err: error,
        http_client_options: createOptionsLog(options),
      },
      `HTTP client will retry #${retryCount} of ${retryLimit}`,
    )
  }

  beforeRedirect(
    options: NormalizedOptions,
    clientResponse: HttpClientResponse,
  ) {
    this.logger.debug(
      { http_client_response: createResponseLog(clientResponse) },
      'HTTP client request will be redirected',
    )
  }

  beforeError(error: GeneralError) {
    const log: Record<string, any> = { err: error }
    if (error instanceof GotError) {
      log.http_client_options = createOptionsLog(error.options)
      if ((error as HTTPError | ParseError | MaxRedirectsError).response) {
        log.http_client_response = createResponseLog(
          (error as HTTPError | ParseError | MaxRedirectsError).response,
        )
      }
    }
    HttpClientInstrumentation.requestErrors.inc({
      host: (error as GotError).options.url.host || 'undefined',
      error_name: error.name,
      code:
        error instanceof HTTPError
          ? error.response.statusCode
          : (error as GotError).code || 'undefined',
    })
    this.logger.error(log, `HTTP client error: ${error.message}`)
  }
}

function createOptionsLog({
  url,
  method,
  username,
  password,
}: NormalizedOptions) {
  return {
    url: createUrlLog(url),
    method,
    username,
    password: password ? cachedStringHasher.hash(password) : undefined,
  }
}

function createResponseLog(
  {
    url,
    requestUrl,
    statusCode,
    statusMessage,
    retryCount,
    isFromCache,
    httpVersion,
    ip,
    timings,
  }: HttpClientResponse,
  includeDurations = false,
) {
  return {
    requested_url:
      requestUrl !== url ? createUrlLog(new URL(requestUrl)) : undefined,
    status_code: statusCode,
    status_message: statusMessage,
    retry_count: retryCount,
    from_cache: isFromCache,
    http_version: httpVersion,
    ip,
    durations: includeDurations ? timings.phases : undefined,
  }
}

function createUrlLog({ protocol, host, pathname, search }: URL) {
  return {
    protocol,
    host,
    path: pathname,
    query_params: search,
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

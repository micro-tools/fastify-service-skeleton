import fastifyPlugin from "fastify-plugin"
import got, { Options, Got, RequestError, Response } from "got"
import merge from "lodash.merge"
import { FastifyInstance } from "fastify"
import { Logger } from "../logging/logging.types"
import { PrometheusMeter } from "../metrics"
import { throwIfUndefined } from "../utils"
import {
  createHttpClientMetrics,
  HttpClientInstrumentation,
} from "./http_client_instrumentation"

export const httpClientPlugin = fastifyPlugin(initHttpClient, {
  name: "http-client",
  fastify: "3.x",
  decorators: { request: ["correlationId"] },
})

async function initHttpClient(
  app: FastifyInstance,
  opts: HttpClientPluginOptions
): Promise<void> {
  const correlationIdHeader = opts.correlationIdHeader || "correlation-id"
  const promMeter =
    opts.prometheusMeter ||
    throwIfUndefined(app.prometheusMeter, "app.prometheusMeter")
  const metrics = createHttpClientMetrics(promMeter)

  // Init app-level client
  app.decorate(
    "httpClient",
    createAppHttpClient(
      new HttpClientInstrumentation(metrics, app.log as Logger),
      opts.defaultOptions
    )
  )

  // Init request-specific client
  app.decorateRequest("httpClient", null, ["correlationId"])
  app.addHook("onRequest", (request, reply, done) => {
    request.httpClient = new HttpClientRequestDecoration(
      app.httpClient,
      request.correlationId,
      correlationIdHeader
    )
    done()
  })
}

/**
 * Creates an preconfigured HTTP client for the application scope.
 */
function createAppHttpClient(
  instrumentation: HttpClientInstrumentation,
  defaultOptions?: HttpClientOptions
): HttpClient {
  const alwaysHooks: HttpClientOptions["hooks"] = {
    beforeRequest: [
      (options): void => {
        instrumentation.beforeRequest(options)
      },
    ],
    afterResponse: [
      (response): Response => {
        instrumentation.receivedResponse(response)
        return response
      },
    ],
    beforeError: [
      (error): RequestError => {
        instrumentation.beforeError(error)
        return error
      },
    ],
    beforeRetry: [
      (options, error, retryCount): void =>
        instrumentation.beforeRetry(options, error, retryCount),
    ],
    beforeRedirect: [
      (options, response): void => {
        instrumentation.beforeRedirect(options, response)
      },
    ],
  }
  return got.extend({
    retry: { limit: 0 }, // Do not retry by default
    ...defaultOptions,
    hooks: merge({}, defaultOptions?.hooks, alwaysHooks),
  })
}

class HttpClientRequestDecoration {
  constructor(
    private readonly appHttpClient: HttpClient,
    private readonly correlationId: string,
    private readonly correlationIdHeader: string
  ) {}

  /**
   * Creates a request-specific HTTP client.
   * @param opts HTTP request options
   */
  create(options?: HttpClientOptions): HttpClient {
    return this.appHttpClient.extend({
      ...options,
      headers: {
        [this.correlationIdHeader]: this.correlationId,
        ...options?.headers,
      },
    })
  }
}

export type HttpClient = Got
export type HttpClientOptions = Options
// Explicit import from got to avoid the usage of `Response` from the DOM lib
export type HttpClientResponse = import("got").Response
export type HttpClientFactory = (opts?: HttpClientOptions) => HttpClient
export interface HttpClientPluginOptions {
  defaultOptions?: HttpClientOptions
  correlationIdHeader?: string
  prometheusMeter?: PrometheusMeter
}

declare module "fastify" {
  interface FastifyInstance {
    httpClient: HttpClient
  }

  interface FastifyRequest {
    httpClient: HttpClientRequestDecoration
  }
}

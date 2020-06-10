import { URL } from "url"
import {
  Response,
  RequestError,
  HTTPError,
  BeforeRequestHook,
  BeforeRedirectHook,
  NormalizedOptions,
} from "got"
import { Logger } from "../logging/logging.types"
import type { PrometheusMeter, Counter, Histogram } from "../metrics"
import { cachedStringHasher, Hashed } from "../utils/cached_string_hasher"

// In some cases we need the parent/core types of the publicly exported types
import type {
  NormalizedOptions as RequestNormalizedOptions,
  Response as RequestResponse,
} from "got/dist/source/core"

export class HttpClientInstrumentation {
  constructor(
    private readonly metrics: HttpClientMetrics,
    private readonly logger: Logger
  ) {}

  beforeRequest(options: Parameters<BeforeRequestHook>[0]): void {
    this.logger.debug(
      { http_client_options: createOptionsLog(options) },
      "HTTP client starts request"
    )
  }

  receivedResponse(clientResponse: RequestResponse): void {
    this.logger.debug(
      { http_client_response: createResponseLog(clientResponse, true) },
      "HTTP client has received response"
    )
    if (typeof clientResponse.timings.phases.total === "number") {
      this.metrics.requestDurations.observe(
        {
          host: new URL(clientResponse.url).host,
          status_code: clientResponse.statusCode,
          is_retry: Number(clientResponse.retryCount > 0),
          from_cache:
            typeof clientResponse.isFromCache === "boolean"
              ? Number(clientResponse.isFromCache)
              : "unknown",
        },
        clientResponse.timings.phases.total / 1000
      )
    } else {
      this.logger.error(
        { http_client_response: createResponseLog(clientResponse) },
        "HTTP client request duration metric is missing"
      )
    }
  }

  beforeRetry(
    options: NormalizedOptions,
    error?: RequestError,
    retryCount?: number
  ): void {
    const retryLimit = options.retry.limit
    this.logger.debug(
      {
        retry_count: retryCount,
        retry_limit: retryLimit,
        err: error,
        http_client_options: createOptionsLog(options),
      },
      `HTTP client will retry #${retryCount} of ${retryLimit}`
    )
  }

  beforeRedirect(
    options: Parameters<BeforeRedirectHook>[0],
    clientResponse: Parameters<BeforeRedirectHook>[1]
  ): void {
    this.logger.debug(
      { http_client_response: createResponseLog(clientResponse) },
      "HTTP client request will be redirected"
    )
  }

  beforeError(error: RequestError): void {
    const log: Record<string, unknown> = { err: error }
    log.http_client_options = createOptionsLog(error.options)
    if (error.response !== undefined) {
      log.http_client_response = createResponseLog(error.response)
    }
    this.metrics.requestErrors.inc({
      host: error.options.url.host || "undefined",
      error_name: error.name,
      code:
        error instanceof HTTPError
          ? error.response.statusCode
          : (error as RequestError).code || "undefined",
    })
    this.logger.error(log, `HTTP client error: ${error.message}`)
  }
}

function createOptionsLog({
  url,
  method,
  username,
  password,
}: RequestNormalizedOptions): OptionsLog {
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
  }: NonNullable<RequestError["response"]>,
  includeDurations = false
): ResponseLog {
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

function createUrlLog({ protocol, host, pathname, search }: URL): UrlLog {
  return {
    protocol,
    host,
    path: pathname,
    query_params: search,
  }
}

interface ResponseLog {
  requested_url: UrlLog | undefined
  status_code: number
  status_message: string | undefined
  retry_count: number
  from_cache: boolean
  http_version: string
  ip: string | undefined
  durations: Response["timings"]["phases"] | undefined
}

type OptionsLog = {
  url: UrlLog
  method: string
  username: string | undefined
  password: Hashed | undefined
}

interface UrlLog {
  protocol: string
  host: string
  path: string
  query_params: string
}

// Metrics

export function createHttpClientMetrics(
  prometheusMeter: PrometheusMeter
): HttpClientMetrics {
  return {
    requestDurations: prometheusMeter.createHistogram({
      name: "http_client_total_request_duration_seconds",
      help: "HTTP client total request durations.",
      labelNames: ["host", "status_code", "is_retry", "from_cache"],
    }),
    requestErrors: prometheusMeter.createCounter({
      name: "http_client_request_errors_total",
      help: "HTTP client total request errors.",
      labelNames: ["host", "error_name", "code"],
    }),
  }
}

interface HttpClientMetrics {
  requestDurations: Histogram<
    "host" | "status_code" | "is_retry" | "from_cache"
  >
  requestErrors: Counter<"host" | "error_name" | "code">
}

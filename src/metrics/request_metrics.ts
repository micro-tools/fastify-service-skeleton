import { FastifyInstance } from "fastify"
import type * as promClient from "prom-client"
import fastifyPlugin from "fastify-plugin"
import { PrometheusMeter } from "./prometheus_meter"
import { throwIfUndefined } from "../utils"

type DefaultLabel = "status_code" | "method" | "path"
const defaultLabels: DefaultLabel[] = ["status_code", "method", "path"]

export const requestMetricsPlugin = fastifyPlugin(initRequestMetrics, {
  name: "request-metrics",
  fastify: "2.x",
  decorators: {
    fastify: ["prometheusMeter"],
  },
})

async function initRequestMetrics<ExtraLabel extends string>(
  app: FastifyInstance,
  opts: RequestMetricsOptions<ExtraLabel>
): Promise<void> {
  const extraLabelNames = opts.extraLabelNames || []
  const promMeter =
    opts.prometheusMeter ||
    throwIfUndefined(app.prometheusMeter, "app.prometheusMeter")

  const durationHistogram = promMeter.createHistogram({
    name: "http_request_duration_seconds",
    help: "HTTP server response time in seconds",
    labelNames: [...defaultLabels, ...extraLabelNames],
  })

  app.decorate(
    "requestMetrics",
    new RequestMetricsAppDecoration(durationHistogram)
  )
  app.decorateRequest("requestMetrics", null)

  app.addHook("onRequest", function addRequestMetrics(request, _reply, done) {
    request.requestMetrics = new RequestMetricsRequestDecoration(
      extraLabelNames
    )
    done()
  })

  app.addHook("onResponse", function observeRequestDuration(
    request,
    reply,
    done
  ) {
    const defaultLabels = {
      method: request.req.method || "unknown",
      path: reply.context.config.url || "unknown",
      status_code: reply.res.statusCode,
    }
    durationHistogram.observe(
      extraLabelNames
        ? { ...defaultLabels, ...request.requestMetrics.extraLabels }
        : defaultLabels,
      reply.getResponseTime() / 1000
    )
    done()
  })
}

class RequestMetricsAppDecoration<Label extends string> {
  constructor(readonly durationHistogram: promClient.Histogram<Label>) {}
}

class RequestMetricsRequestDecoration<ExtraLabel extends string> {
  readonly labelNames: ExtraLabel[]
  readonly extraLabels: promClient.LabelValues<ExtraLabel>

  constructor(labelNames: ExtraLabel[]) {
    this.labelNames = labelNames
    this.extraLabels = {}
  }

  addLabel(name: ExtraLabel, value: string | number): void {
    this.extraLabels[name] = value
  }
}

export interface RequestMetricsOptions<ExtraLabel extends string = string> {
  extraLabelNames?: ExtraLabel[]
  prometheusMeter?: PrometheusMeter
}

declare module "fastify" {
  interface FastifyInstance {
    requestMetrics: RequestMetricsAppDecoration<string>
  }
  interface FastifyRequest {
    requestMetrics: RequestMetricsRequestDecoration<string>
  }
}

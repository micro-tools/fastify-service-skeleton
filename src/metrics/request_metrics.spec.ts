import fastify from "fastify"
import { Registry } from "prom-client"

import { requestMetricsPlugin } from "./request_metrics"
import { prometheusMeterPlugin } from "./prometheus_meter"

describe("Request metrics", () => {
  it("observes request durations", async () => {
    const app = fastify()
      .register(prometheusMeterPlugin, { defaultRegisters: [new Registry()] })
      .register(requestMetricsPlugin)
      .get("/test/:someParam", (request, reply) => {
        reply.send({ ok: "ok" })
      })
    await app.ready()
    const observeSpy = jest.spyOn(
      app.requestMetrics.durationHistogram,
      "observe"
    )

    await app.inject({ url: "/test/abc123?d=4" })
    expect(observeSpy).toHaveBeenCalledTimes(1)
    expect(observeSpy.mock.calls[0][0]).toStrictEqual({
      method: "GET",
      path: "/test/:someParam",
      status_code: 200,
    })
    expect(observeSpy.mock.calls[0][1]).toBeGreaterThanOrEqual(0)

    await app.inject({ url: "/some/unkown/path" })
    expect(observeSpy).toHaveBeenCalledTimes(2)
    expect(observeSpy.mock.calls[1][0]).toStrictEqual({
      method: "GET",
      path: "unknown",
      status_code: 404,
    })
    expect(observeSpy.mock.calls[1][1]).toBeGreaterThanOrEqual(0)

    await app.close()
  })

  it("allows to add extra labels", async () => {
    const app = fastify()
      .register(prometheusMeterPlugin, { defaultRegisters: [new Registry()] })
      .register(requestMetricsPlugin, {
        extraLabelNames: ["test_param", "optional_extra"],
      })
      .get<{ Params: { testParam: string } }>(
        "/test/:testParam",
        (request, reply) => {
          request.requestMetrics.addLabel(
            "test_param",
            request.params.testParam
          )
          reply.send({ ok: "ok" })
        }
      )
    await app.ready()
    const observeSpy = jest.spyOn(
      app.requestMetrics.durationHistogram,
      "observe"
    )

    await app.inject({ url: "/test/extra1" })
    expect(observeSpy).toHaveBeenCalledTimes(1)
    expect(observeSpy.mock.calls[0][0]).toStrictEqual({
      method: "GET",
      path: "/test/:testParam",
      status_code: 200,
      test_param: "extra1",
    })
    expect(observeSpy.mock.calls[0][1]).toBeGreaterThanOrEqual(0)

    await app.close()
  })
})

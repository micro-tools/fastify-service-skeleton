import Fastify from "fastify"
import { correlationIdPlugin } from "./correlation_id"

describe("Correlation ID", () => {
  it("adds a generated correlationId uuid to the request object if not provided via header", async () => {
    const app = Fastify()
      .register(correlationIdPlugin)
      .get("/", function (request, reply) {
        expect(this.hasRequestDecorator("correlationId"))
        expect(typeof request.correlationId).toBe("string")
        expect(request.correlationId).not.toBe("")
        void reply.code(200).send()
      })
    await app.ready()
    const { statusCode } = await app.inject({ method: "GET", url: "/" })

    expect(statusCode).toBe(200)
    await app.close()
  })

  it("adds the correlationId from the corresponding header to the request object", async () => {
    const correlationId = "test-correlation-id"
    const app = Fastify()
      .register(correlationIdPlugin)
      .get("/", function (request, reply) {
        expect(this.hasRequestDecorator("correlationId"))
        expect(request.correlationId).toBe(correlationId)
        void reply.code(200).send()
      })
    await app.ready()
    const { statusCode } = await app.inject({
      method: "GET",
      url: "/",
      headers: { "Correlation-Id": correlationId },
    })

    expect(statusCode).toBe(200)
    await app.close()
  })

  it("adds the correlationId response header", async () => {
    const correlationId = "test-correlation-id"
    const app = Fastify()
      .register(correlationIdPlugin)
      .get("/", function (request, reply) {
        void reply.code(200).send()
      })
    await app.ready()
    const response = await app.inject({
      method: "GET",
      url: "/",
      headers: { "Correlation-Id": correlationId },
    })

    expect(response.statusCode).toBe(200)
    expect(response.headers["correlation-id"]).toBe(correlationId)
    await app.close()
  })
})

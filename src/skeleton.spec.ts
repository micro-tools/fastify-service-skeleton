import {
  createDestinationStream,
  collectLogsUntil,
} from "./logging/logger_test_utils"
import { createServiceSkeleton } from "./skeleton"

describe("serviceSkeleton", () => {
  const serviceName = "serviceSkeletonTest"

  it("starts with default configs", async () => {
    const app = createServiceSkeleton({ serviceName })
    await app.ready()
    await app.close()
  })

  it("uses the skeleton logger instead of the default one", async () => {
    const logDestination = createDestinationStream()
    const app = createServiceSkeleton({
      serviceName,
      logging: { destination: logDestination },
      enablePluginsByDefault: false,
    }).get("/", (request, reply) => {
      request.log.info("log from request")
      void reply.code(200).send()
    })
    await app.ready()
    app.log.info("log from app")
    const responsePromise = app.inject({ method: "GET", url: "/" })
    const logsPromise = collectLogsUntil(logDestination, responsePromise)
    const [response, logs] = await Promise.all([responsePromise, logsPromise])

    expect(response.statusCode).toBe(200)
    expect(logs.length).toBeGreaterThanOrEqual(2)
    for (const log of logs) {
      // the default fastify logger does not log a `service` property
      expect(log.service).toBe(serviceName)
    }
    await app.close()
  })

  it("can be instantiated multiple times (e.g. for testing)", async () => {
    const app1 = createServiceSkeleton({ serviceName })
    const app2 = createServiceSkeleton({ serviceName })
    try {
      await Promise.all([app1.ready(), app2.ready()])
    } finally {
      await Promise.all([app1.close(), app2.close()])
    }
  })
})

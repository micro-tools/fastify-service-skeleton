import {
  createDestinationStream,
  collectLogsUntil,
} from './logger/logger_test_utils'
import { createServiceSkeleton } from './skeleton'

describe('serviceSkeleton', () => {
  const serviceName = 'serviceSkeletonTest'

  it('starts with default configs', async () => {
    const app = await createServiceSkeleton({
      serviceName,
      plugins: {
        orderlyExitProcess: false, // TODO: does not work when it is enabled
      },
    }).ready()
    await app.close()
  })

  it('uses the skeleton logger instead of the default one', async () => {
    const logDestination = createDestinationStream()
    const app = await createServiceSkeleton({
      serviceName,
      logger: { destination: logDestination },
      plugins: false,
    })
      .get('/', (request, reply) => {
        request.log.info('log from request')
        reply.code(200).send()
      })
      .ready()
    app.log.info('log from app')
    const responsePromise = app.inject({ method: 'GET', url: '/' })
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
})

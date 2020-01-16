import { isIP } from 'net'
import { createDestinationStream, collectLogsUntil } from './logger_test_utils'
import { createServiceSkeleton } from '../skeleton'
import { HTTPInjectOptions } from 'fastify'

describe('Request Logging', () => {
  const serviceName = 'request-logging-test'

  it('writes access logs with required fields on response', async () => {
    const logDestination = createDestinationStream()
    const requestIdLogLabel = 'test_req_id'
    const app = await createServiceSkeleton({
      serviceName,
      fastify: { requestIdLogLabel },
      enablePluginsByDefault: false,
      logging: { destination: logDestination },
      plugins: {
        correlationId: { enable: true },
        requestLogging: { enable: true },
      },
    })
      .get('/test', (request, reply) => {
        reply.code(200).send()
      })
      .ready()
    const request: HTTPInjectOptions = {
      method: 'GET',
      url: '/test',
      query: { nums: [1, 2] },
      headers: { 'user-agent': 'Some-Agent/1.0' },
    }
    const responsePromise = app.inject(request)
    const logsPromise = collectLogsUntil(logDestination, responsePromise)
    const [response, logs] = await Promise.all([responsePromise, logsPromise])
    const accessLogs = logs.filter(log => log.log_type === 'access')

    expect(response.statusCode).toBe(200)
    expect(accessLogs).toHaveLength(1)
    for (const log of accessLogs) {
      expect(log.loglevel).toBe('INFO')
      expect(log[requestIdLogLabel]).toBeTruthy()
      expect(isIP(log.remote_address))
      expect(Number.isInteger(log.response_time))
      expect(log.response_time).toBeGreaterThan(0)
      expect(typeof log['@timestamp']).toBe('string')
      expect(new Date(log['@timestamp']).getTime()).toBeLessThanOrEqual(
        Date.now(),
      )
      expect(typeof log['correlation-id']).toBe('string')
      expect(log.request_method).toBe('GET')
      expect(log.uri).toBe('/test')
      expect(log.query_string).toBe('?nums=1&nums=2')
      expect(log.status).toBeGreaterThanOrEqual(200)
      expect(log.status).toBeLessThan(600)
      expect(log.user_agent).toBe(request.headers!['user-agent'])
      // TODO
      // expect(typeof log.protocol).toBe('string')
    }
    await app.close()
  })

  test("the access logs' logLevel can be modified via route config", async () => {
    const accessLogLevel = 'DEBUG'
    const logDestination = createDestinationStream()
    const app = await createServiceSkeleton({
      serviceName,
      enablePluginsByDefault: false,
      logging: { destination: logDestination, level: accessLogLevel },
      plugins: {
        correlationId: { enable: true },
        requestLogging: { enable: true },
      },
    })
      .get('/test', {
        config: { accessLogLevel },
        handler(request, reply) {
          reply.code(200).send()
        },
      })
      .ready()
    const responsePromise = app.inject({ method: 'GET', url: '/test' })
    const logsPromise = collectLogsUntil(logDestination, responsePromise)
    const [response, logs] = await Promise.all([responsePromise, logsPromise])
    const accessLogs = logs.filter(log => log.log_type === 'access')

    expect(response.statusCode).toBe(200)
    expect(accessLogs).toHaveLength(1)
    expect(accessLogs[0].loglevel).toBe(accessLogLevel)
    await app.close()
  })

  it('adds request and correlation ids to logs created in the context of a request', async () => {
    const logDestination = createDestinationStream()
    const app = await createServiceSkeleton({
      serviceName,
      enablePluginsByDefault: false,
      logging: { destination: logDestination },
      plugins: {
        correlationId: { enable: true },
        requestLogging: { enable: true },
      },
    })
      .get('/', (request, reply) => {
        request.log.info('in the context of a request #1')
        reply.log.info('in the context of a request #2')
        reply.code(200).send()
      })
      .ready()
    const responsePromise = app.inject({ method: 'GET', url: '/' })
    const logsPromise = collectLogsUntil(logDestination, responsePromise)
    const [response, logs] = await Promise.all([responsePromise, logsPromise])

    expect(response.statusCode).toBe(200)
    expect(logs).toHaveLength(3) // one access log + the two from the request handler
    for (const log of logs) {
      expect(typeof log.request_id).toBeTruthy()
      expect(typeof log['correlation-id']).toBe('string')
    }
    await app.close()
  })
})

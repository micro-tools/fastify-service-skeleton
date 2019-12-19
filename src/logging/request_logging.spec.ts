import { isIP } from 'net'
import Fastify from 'fastify'
import {
  createDestinationStream,
  collectLogsUntil,
} from './utils/logger_test_utils'
import { requestLoggingPlugin } from './request_logging'

describe('Request Logging', () => {
  const serviceName = 'request-logging-test'

  it('writes access logs with required fields on response', async () => {
    const logDestination = createDestinationStream()
    const app = await Fastify({
      // disable default logging
      logger: false,
      disableRequestLogging: true,
    })
      .register(requestLoggingPlugin, {
        serviceName,
        destination: logDestination,
      })
      .get('/', (request, reply) => {
        reply.code(200).send()
      })
      .ready()
    const responsePromise = app.inject({ method: 'GET', url: '/' })
    const logsPromise = collectLogsUntil(logDestination, responsePromise)
    const [response, logs] = await Promise.all([responsePromise, logsPromise])
    const accessLogs = logs.filter(log => log.log_type === 'access')

    expect(response.statusCode).toBe(200)
    expect(accessLogs).toHaveLength(1)
    for (const log of accessLogs) {
      expect(log.loglevel).toBe('INFO')
      expect(isIP(log.remote_address))
      expect(Number.isInteger(log.response_time))
      expect(log.response_time).toBeGreaterThan(0)
      expect(typeof log['@timestamp']).toBe('string')
      expect(new Date(log['@timestamp']).getTime()).toBeLessThanOrEqual(
        Date.now(),
      )
      expect(typeof log['correlation-id']).toBe('string')
    }
    await app.close()
  })

  it('adds request and correlation ids to logs created in the context of a request', async () => {
    const logDestination = createDestinationStream()
    const app = await Fastify({
      logger: logDestination, // enable logging in general and collect logs in a custom destination
      disableRequestLogging: true, // disable fastify's default request logging
    })
      .register(requestLoggingPlugin, {
        serviceName,
        destination: logDestination,
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
      expect(typeof log.request_id).toBe('number')
      expect(typeof log['correlation-id']).toBe('string')
    }
    await app.close()
  })
})

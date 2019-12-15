import Fastify from 'fastify'
import { createLogger } from './logger'
import {
  createDestinationStream,
  collectLogsUntil,
} from './utils/logger_test_utils'
import correlationIdPlugin from './correlation_id'

describe('Correlation ID', () => {
  it('adds `correlationId` to request', async () => {
    const app = await Fastify()
      .register(correlationIdPlugin)
      .get('/', (request, reply) => {
        expect(typeof request.correlationId).toBe('string')
        reply.code(200).send()
      })
      .ready()
    const { statusCode } = await app.inject({ method: 'GET', url: '/' })

    expect(statusCode).toBe(200)
    await app.close()
  })
})

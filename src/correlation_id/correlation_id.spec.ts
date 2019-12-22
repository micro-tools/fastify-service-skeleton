import Fastify from 'fastify'
import { correlationIdPlugin } from './correlation_id'

describe('Correlation ID', () => {
  it('adds a generated correlationId uuid to request if not provided via header', async () => {
    const app = await Fastify()
      .register(correlationIdPlugin)
      .get('/', function(request, reply) {
        expect(this.hasRequestDecorator('correlationId'))
        expect(typeof request.correlationId).toBe('string')
        expect(request.correlationId.length).not.toBe('')
        reply.code(200).send()
      })
      .ready()
    const { statusCode } = await app.inject({ method: 'GET', url: '/' })

    expect(statusCode).toBe(200)
    await app.close()
  })

  it('adds the correlationId from the corresponding header to request', async () => {
    const correlationId = 'test-correlation-id'
    const app = await Fastify()
      .register(correlationIdPlugin)
      .get('/', function(request, reply) {
        expect(this.hasRequestDecorator('correlationId'))
        expect(request.correlationId).toBe(correlationId)
        reply.code(200).send()
      })
      .ready()
    const { statusCode } = await app.inject({
      method: 'GET',
      url: '/',
      headers: { 'Correlation-Id': correlationId },
    })

    expect(statusCode).toBe(200)
    await app.close()
  })
})

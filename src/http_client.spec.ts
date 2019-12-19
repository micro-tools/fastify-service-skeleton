import fastify from 'fastify'
import uuidV4 from 'uuid/v4'
import { httpClientPlugin } from './http_client'
import fastifyPlugin from 'fastify-plugin'
import { correlationIdPlugin } from './logging/correlation_id'

describe('httpClient plugin', () => {
  it('allows to create a request specific httpClient', async () => {
    const app = await fastify()
      .register(correlationIdPlugin) // depends on correlationId
      .register(httpClientPlugin)
      .get('/', (request, reply) => {
        expect(typeof request.createHttpClient).toBe('function')
        expect(typeof request.createHttpClient().request).toBe('function')
        reply.code(200).send()
      })
      .ready()
    const res = await app.inject({ method: 'GET', url: '/' })
    expect(res.statusCode).toBe(200)
    await app.close()
  })

  it('forwards the correlationId as header', async () => {
    const correlationId = uuidV4()
    const app = await fastify()
      .register(correlationIdPlugin) // depends on correlationId
      .register(httpClientPlugin)
      .get('/', (request, reply) => {
        expect(
          request.createHttpClient().defaults.headers['Correlation-Id'],
        ).toBe(correlationId)
        reply.code(200).send()
      })
      .ready()
    const res = await app.inject({
      method: 'GET',
      url: '/',
      headers: { 'Correlation-Id': correlationId },
    })
    expect(res.statusCode).toBe(200)
    await app.close()
  })
})

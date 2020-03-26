import fastify from 'fastify'
import { v4 as uuidV4 } from 'uuid'
import nock from 'nock'
import {
  httpClientPlugin,
  HttpClientPluginOptions,
  HttpClientInstrumentation,
} from './http_client'
import { correlationIdPlugin } from './correlation_id'

describe('httpClient plugin', () => {
  it('allows to create a request-specific HTTP client', async () => {
    const app = await fastify()
      .register(correlationIdPlugin) // depends on correlationId
      .register(httpClientPlugin)
      .get('/', (request, reply) => {
        expect(typeof request.createHttpClient).toBe('function')
        expect(typeof request.createHttpClient()).toBe('function')
        reply.code(200).send()
      })
      .ready()
    const res = await app.inject({ method: 'GET', url: '/' })
    expect(res.statusCode).toBe(200)
    await app.close()
  })

  it('merges all headers and forwards the correlation-id header', async () => {
    const correlationId = uuidV4()
    const fakeTargetUrl = 'https://test'
    const checkOptionsHook = (opts: HttpClientPluginOptions) => {
      expect(opts.headers).toMatchObject({
        'correlation-id': correlationId,
        'plugin-register-header': 'pluginRegister',
        'create-client-header': 'createClient',
        'request-header': 'request',
      })
    }
    const app = await fastify()
      .register(correlationIdPlugin) // depends on correlationId
      .register(httpClientPlugin, {
        headers: { 'plugin-register-header': 'pluginRegister' },
        hooks: { beforeRequest: [checkOptionsHook] },
      })
      .get('/', async (request, reply) => {
        await request
          .createHttpClient({
            headers: { 'create-client-header': 'createClient' },
          })
          .get(fakeTargetUrl, { headers: { 'request-header': 'request' } })
        reply.code(200).send()
      })
      .ready()
    const nockScope = nock(fakeTargetUrl).get('/').reply(200, '{"ok": true}')

    const res = await app.inject({
      method: 'GET',
      url: '/',
      headers: { 'Correlation-Id': correlationId },
    })
    expect(res.statusCode).toBe(200)
    expect(nockScope.isDone())

    nock.cleanAll()
    await app.close()
  })

  describe('metrics', () => {
    it('counts HTTPErrors (triggered when configured and status code is not 2xx)', async () => {
      const fakeTargetUrl = 'https://testhost'
      const fakeTargetNock = nock(fakeTargetUrl)
        .get('/')
        .reply(500, '{"error": "broken"}')
      const app = await fastify()
        .register(correlationIdPlugin) // depends on correlationId
        .register(httpClientPlugin)
        .get('/', async (request, reply) => {
          await request
            .createHttpClient({ throwHttpErrors: true })
            .get(fakeTargetUrl)
          reply.code(200).send()
        })
        .ready()
      const incErrorCounterSpy = jest.spyOn(
        HttpClientInstrumentation.requestErrors,
        'inc',
      )
      incErrorCounterSpy.mockClear()

      const res = await app.inject({ method: 'GET', url: '/' })
      expect(res.statusCode).toBe(500)
      expect(fakeTargetNock.isDone())
      expect(incErrorCounterSpy).toHaveBeenCalledTimes(1)
      expect(incErrorCounterSpy.mock.calls[0][0]).toStrictEqual({
        host: 'testhost',
        error_name: 'HTTPError',
        code: 500,
      })
      await app.close()
    })

    it('counts request errors (like ENOTFOUND)', async () => {
      const fakeTargetUrl = 'https://testhost'
      const fakeTargetNock = nock(fakeTargetUrl)
        .get('/')
        .replyWithError({ code: 'ENOTFOUND' })
      const app = await fastify()
        .register(correlationIdPlugin) // depends on correlationId
        .register(httpClientPlugin)
        .get('/', async (request, reply) => {
          await request
            .createHttpClient({ throwHttpErrors: true })
            .get(fakeTargetUrl)
          reply.code(200).send()
        })
        .ready()
      const incErrorCounterSpy = jest.spyOn(
        HttpClientInstrumentation.requestErrors,
        'inc',
      )
      incErrorCounterSpy.mockClear()

      const res = await app.inject({ method: 'GET', url: '/' })
      expect(res.statusCode).toBe(500)
      expect(fakeTargetNock.isDone())
      expect(incErrorCounterSpy).toHaveBeenCalledTimes(1)
      expect(incErrorCounterSpy.mock.calls[0][0]).toStrictEqual({
        host: 'testhost',
        error_name: 'RequestError',
        code: 'ENOTFOUND',
      })
      await app.close()
    })
  })
})

interface ErrorWithCode extends Error {
  code: string
}

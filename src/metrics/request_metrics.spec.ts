import fastify from 'fastify'
import { collectRequestMetrics } from './request_metrics'

describe('Request metrics', () => {
  it('observes request durations', async () => {
    const app = fastify().get('/test/:someParam', (request, reply) => {
      reply.send({ ok: 'ok' })
    })
    const histogram = collectRequestMetrics(app)
    const observeSpy = jest.spyOn(histogram, 'observe')
    await app.ready()

    await app.inject({ url: '/test/abc123?d=4' })
    expect(observeSpy).toHaveBeenCalledTimes(1)
    expect(observeSpy.mock.calls[0][0]).toStrictEqual({
      method: 'GET',
      path: '/test/:someParam',
      status_code: 200,
    })
    expect(observeSpy.mock.calls[0][1]).toBeGreaterThanOrEqual(0)

    await app.inject({ url: '/some/unkown/path' })
    expect(observeSpy).toHaveBeenCalledTimes(2)
    expect(observeSpy.mock.calls[1][0]).toStrictEqual({
      method: 'GET',
      path: 'unknown',
      status_code: 404,
    })
    expect(observeSpy.mock.calls[1][1]).toBeGreaterThanOrEqual(0)
  })
})

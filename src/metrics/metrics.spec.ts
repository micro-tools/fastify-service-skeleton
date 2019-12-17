import Fastify from 'fastify'
import metricsPlugin from './'

describe('Metrics plugin', () => {
  it('exposes metrics via an http endpoint', async () => {
    const app = await Fastify()
      .register(metricsPlugin)
      .ready()
    const res = await app.inject({ method: 'GET', url: '/admin/metrics' })
    expect(res.statusCode).toBe(200)
    expect(res.headers['content-type']).toBe('text/plain; version=0.0.4')
    expect(typeof res.payload).toBe('string')
    await app.close()
  })
})

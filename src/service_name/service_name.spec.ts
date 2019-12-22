import Fastify from 'fastify'
import { serviceNamePlugin } from './service_name'

describe('Service Name', () => {
  it('adds `serviceName` to fastify', async () => {
    const serviceName = 'service-name-test'
    const app = await Fastify()
      .register(serviceNamePlugin, { serviceName })
      .ready()

    expect(app.hasDecorator('serviceName'))
    expect(app.serviceName).toBe(serviceName)
    await app.close()
  })
})

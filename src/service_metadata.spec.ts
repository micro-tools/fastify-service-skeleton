import Fastify from 'fastify'
import { serviceMetadata } from './service_metadata'

describe('Service Name', () => {
  it('adds `serviceName` to fastify', async () => {
    const serviceName = 'service-name-test'
    const app = await Fastify()
      .register(serviceMetadata, { serviceName })
      .ready()

    expect(app.hasDecorator('serviceName'))
    expect(app.serviceName).toBe(serviceName)
    await app.close()
  })
})

import { createServiceSkeleton, Plugin } from '../src'

async function main() {
  const app = createServiceSkeleton({
    serviceName: 'example-service',
    logging: { prettyPrint: true, level: 'DEBUG' },
  })
  const exampleOptions: ExampleOptions = { someNumber: 7 }
  app.register(examplePlugin, { ...exampleOptions, prefix: 'example/' })
  await app.listen(3000)
}

const examplePlugin: Plugin<ExampleOptions> = async (app, opts) => {
  app.get('/echo', async (request, reply) => {
    const response = await request
      .createHttpClient()
      .get('https://postman-echo.com/get', {
        searchParams: {
          ...request.query, // forward query string
          someNumber: opts?.someNumber || null,
        },
        responseType: 'json',
      })
    reply.send(response.body)
  })

  app.get('/error', async (request, reply) => {
    const postmanEchoClient = request.createHttpClient({
      prefixUrl: 'https://postman-echo.com',
      responseType: 'json',
    })
    const response = await postmanEchoClient.get('status/500')
    // should never get here, because the response above will throw
    reply.send(response.body)
  })
}

interface ExampleOptions {
  someNumber: number
}

main()

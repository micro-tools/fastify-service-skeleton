import { createServiceSkeleton } from '../src'

async function main() {
  const app = createServiceSkeleton({
    serviceName: 'example-service',
    logging: { prettyPrint: true, level: 'DEBUG' },
  })

  app.get('/echo', async (request, reply) => {
    const response = await request
      .createHttpClient()
      .get('https://postman-echo.com/get', {
        searchParams: request.query, // forward query parameters
      })
    reply.code(response.statusCode).send(response.body)
  })

  app.get('/error', async (request, reply) => {
    const postmanEchoClient = request.createHttpClient({
      prefixUrl: 'https://postman-echo.com',
    })
    const response = await postmanEchoClient.get('status/500')
    reply.send(response.body)
  })

  await app.listen(3000)
}

main()

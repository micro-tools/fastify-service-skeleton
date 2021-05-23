import { createServiceSkeleton } from "../src"
import { FastifyInstance } from "fastify"

async function main(): Promise<void> {
  const app = createServiceSkeleton({
    serviceName: "example-service",
    logging: { prettyPrint: true, level: "DEBUG" },
  })
  const exampleOptions: ExampleOptions = { someNumber: 7 }
  app.register(examplePlugin, { ...exampleOptions, prefix: "example/" })
  await app.listen(3000)
}

async function examplePlugin(
  app: FastifyInstance,
  opts: ExampleOptions
): Promise<void> {
  app.get<{ Querystring: Record<string, unknown> }>(
    "/echo",
    async (request, reply) => {
      const response = await request.httpClient
        .create()
        .get("https://postman-echo.com/get", {
          searchParams: {
            ...request.query, // forward query string
            someNumber: opts.someNumber ?? null,
          },
          responseType: "json",
        })
      reply.send(response.body)
    }
  )

  app.get("/error", async (request, reply) => {
    const postmanEchoClient = request.httpClient.create({
      prefixUrl: "https://postman-echo.com",
      responseType: "json",
    })
    const response = await postmanEchoClient.get("status/500")
    // should never get here, because the response above will throw
    reply.send(response.body)
  })

  app.get("/throw", async () => {
    throw new Error("ups")
  })

  app.get<{ Querystring: { name: string } }>(
    "/hello",
    {
      schema: {
        querystring: {
          type: "object",
          properties: { name: { type: "string" } },
          required: ["name"],
        },
      },
    },
    async (request) => {
      return { hello: request.query.name }
    }
  )
}

interface ExampleOptions {
  someNumber: number
}

main()
